import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const skip = (page - 1) * limit

    // 1. Fetch user, profile, and active resume
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: {
        profile: true,
        currentResume: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Extract user & resume signals
    const userSkills: string[] = []
    if (user.profile?.skillsJson && Array.isArray(user.profile.skillsJson)) {
      for (const s of user.profile.skillsJson) {
        if (typeof s === 'string') userSkills.push(s)
        else if (s && typeof s === 'object' && 'name' in s) userSkills.push((s as any).name)
      }
    }

    const resumeSkills: string[] = []
    if (user.currentResume?.skillsJson && Array.isArray(user.currentResume.skillsJson)) {
      for (const s of user.currentResume.skillsJson) {
        if (typeof s === 'string') resumeSkills.push(s)
      }
    }

    const targetRoles = Array.isArray(user.targetRoles) ? (user.targetRoles as string[]) : []
    const preferredLocations = Array.isArray(user.preferredLocations) ? (user.preferredLocations as string[]) : []
    const preferredWorkMode = user.preferredWorkMode || 'any'
    const resumeSummary = (user.currentResume?.parsedSections as any)?.summary || user.profile?.bio || ''
    const resumeText = user.currentResume?.extractedText || ''

    // 2. Fetch active jobs from DB
    const jobs = await prisma.job.findMany({
      where: { jobStatus: 'active' },
      include: {
        company: {
          select: {
            id: true,
            companyName: true,
            domain: true,
            logoUrl: true,
            fresherFriendly: true,
          }
        },
        requirements: true,
        matches: {
          where: { userId: session.userId }
        }
      },
      take: 50,
      orderBy: { postedAt: 'desc' }
    })

    if (!jobs || jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        pagination: { page, limit, total: 0 }
      })
    }

    // 3. Score jobs via Python microservice /match/batch
    const BACKEND_URL = process.env.BACKEND_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    const API_KEY = process.env.INTERNAL_API_KEY || process.env.PYTHON_API_KEY || 'internal-secret-key'

    let batchResults: any[] = []
    try {
      const matchPayload = {
        user_skills: userSkills,
        resume_skills: resumeSkills,
        resume_summary: resumeSummary,
        resume_text: resumeText,
        target_roles: targetRoles,
        preferred_locations: preferredLocations,
        preferred_work_mode: preferredWorkMode,
        top_k: 10,
        jobs: jobs.map(j => ({
          id: j.id,
          job_title: j.jobTitle,
          company_name: j.company?.companyName || 'Company',
          skills_json: j.skillsJson || [],
          required_skills: j.requirements.filter(r => r.requirementType === 'required').map(r => r.skillName),
          preferred_skills: j.requirements.filter(r => r.requirementType === 'preferred').map(r => r.skillName),
          description: j.description || '',
          location: j.location || 'Unknown',
          remote_type: j.remoteType || 'unknown',
          experience_level: j.experienceLevel || 'entry',
          source: j.source,
          confidence_score: j.confidenceScore ? Number(j.confidenceScore) : 0.8,
          posted_at: j.postedAt?.toISOString()
        }))
      }

      const matchRes = await fetch(`${BACKEND_URL}/match/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': API_KEY,
        },
        body: JSON.stringify(matchPayload),
      })

      if (matchRes.ok) {
        const matchData = await matchRes.json()
        batchResults = matchData.results || []
      }
    } catch (err) {
      console.warn('Python batch matching failed, using fallback database scores:', err)
    }

    // 4. Map and persist matches in database
    const resultMap = new Map<string, any>()
    for (const r of batchResults) {
      resultMap.set(r.job_id, r)
    }

    const formattedJobs = []
    for (const j of jobs) {
      const matchInfo = resultMap.get(j.id)
      let finalScore = 70.0
      let baseScore = 70.0
      let taxonomyScore = 60.0
      let rerankScore = 70.0
      let explanation: any = {}

      if (matchInfo) {
        finalScore = matchInfo.final_score
        baseScore = matchInfo.match_score
        taxonomyScore = matchInfo.taxonomy_score
        rerankScore = matchInfo.rerank_score
        explanation = matchInfo.explanation || {}

        // Persist to database asynchronously
        prisma.jobMatch.upsert({
          where: {
            userId_jobId: {
              userId: session.userId,
              jobId: j.id,
            }
          },
          update: {
            matchScore: baseScore,
            taxonomyScore: taxonomyScore,
            rerankScore: rerankScore,
            finalScore: finalScore,
            taxonomyEvidenceJson: explanation.taxonomy_matches || [],
            rerankExplanationJson: {
              strengths: explanation.strengths || [],
              gaps: explanation.gaps || [],
              why_ranked_here: explanation.why_ranked_here || ''
            },
            rerankModel: explanation.reranker_model || 'rule-based',
            explanationJson: explanation,
          },
          create: {
            userId: session.userId,
            jobId: j.id,
            matchScore: baseScore,
            taxonomyScore: taxonomyScore,
            rerankScore: rerankScore,
            finalScore: finalScore,
            taxonomyEvidenceJson: explanation.taxonomy_matches || [],
            rerankExplanationJson: {
              strengths: explanation.strengths || [],
              gaps: explanation.gaps || [],
              why_ranked_here: explanation.why_ranked_here || ''
            },
            rerankModel: explanation.reranker_model || 'rule-based',
            explanationJson: explanation,
          }
        }).catch(e => console.error('Failed to upsert job match:', e))
      } else if (j.matches && j.matches.length > 0) {
        const m = j.matches[0]
        finalScore = m.finalScore ? Number(m.finalScore) : Number(m.matchScore)
        baseScore = Number(m.matchScore)
        explanation = m.explanationJson || {}
      }

      formattedJobs.push({
        id: j.id,
        job_title: j.jobTitle,
        company_name: j.company?.companyName || 'Technology Company',
        company: j.company,
        location: j.location,
        remote_type: j.remoteType,
        job_type: j.jobType,
        experience_level: j.experienceLevel,
        apply_url: j.applyUrl,
        source: j.source,
        confidence_score: j.confidenceScore ? Number(j.confidenceScore) : 0.8,
        posted_at: j.postedAt?.toISOString(),
        skills_json: j.skillsJson,
        match: {
          score: finalScore,
          base_score: baseScore,
          taxonomy_score: taxonomyScore,
          rerank_score: rerankScore,
          final_score: finalScore,
          matched_skills: explanation.matched_skills || [],
          missing_skills: explanation.missing_required || [],
          taxonomy_matches: explanation.taxonomy_matches || [],
          fresher_fit: explanation.fresher_fit_reason || 'Entry-level role - good fit',
          confidence_level: explanation.confidence_level || 'High confidence',
          source_label: explanation.source_label || (j.source === 'greenhouse' ? 'Verified ATS feed' : 'Aggregated feed'),
          strengths: explanation.strengths || [],
          gaps: explanation.gaps || [],
          why_ranked_here: explanation.why_ranked_here || '',
          fallback_used: explanation.fallback_used ?? true
        }
      })
    }

    // Sort by match score descending
    formattedJobs.sort((a, b) => b.match.score - a.match.score)

    const paginated = formattedJobs.slice(skip, skip + limit)

    return NextResponse.json({
      jobs: paginated,
      pagination: {
        page,
        limit,
        total: formattedJobs.length
      }
    })

  } catch (error: any) {
    console.error('Recommendations error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
