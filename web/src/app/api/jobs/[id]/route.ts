import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getAuthUser(req)

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        company: true,
        requirements: true,
        matches: session ? {
          where: { userId: session.userId }
        } : false
      },
    })

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    let matchInfo = job.matches && job.matches.length > 0 ? job.matches[0] : null

    // If logged in and no match cached, compute on the fly
    if (!matchInfo && session) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: session.userId },
          include: { profile: true, currentResume: true }
        })

        if (user) {
          const userSkills: string[] = []
          if (user.profile?.skillsJson && Array.isArray(user.profile.skillsJson)) {
            for (const s of user.profile.skillsJson) {
              if (typeof s === 'string') userSkills.push(s)
              else if (s && typeof s === 'object' && 'name' in s) userSkills.push((s as any).name)
            }
          }
          if (user.currentResume?.skillsJson && Array.isArray(user.currentResume.skillsJson)) {
            for (const s of user.currentResume.skillsJson) {
              if (typeof s === 'string') userSkills.push(s)
            }
          }

          const BACKEND_URL = process.env.BACKEND_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
          const API_KEY = process.env.INTERNAL_API_KEY || process.env.PYTHON_API_KEY || 'internal-secret-key'

          const matchRes = await fetch(`${BACKEND_URL}/match/compute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-API-KEY': API_KEY,
            },
            body: JSON.stringify({
              user_skills: userSkills,
              resume_skills: userSkills,
              resume_summary: user.profile?.bio || '',
              resume_text: user.currentResume?.extractedText || '',
              target_roles: Array.isArray(user.targetRoles) ? user.targetRoles : [],
              preferred_locations: Array.isArray(user.preferredLocations) ? user.preferredLocations : [],
              preferred_work_mode: user.preferredWorkMode || 'any',
              job_id: job.id,
              job_title: job.jobTitle,
              company_name: job.company?.companyName || '',
              job_required_skills: job.requirements.filter(r => r.requirementType === 'required').map(r => r.skillName),
              job_preferred_skills: job.requirements.filter(r => r.requirementType === 'preferred').map(r => r.skillName),
              job_description: job.description || '',
              job_location: job.location || 'Unknown',
              job_remote_type: job.remoteType || 'unknown',
              job_experience_level: job.experienceLevel || 'entry',
              job_source: job.source,
              job_confidence_score: job.confidenceScore ? Number(job.confidenceScore) : 0.8,
              job_posted_at: job.postedAt?.toISOString(),
              execute_rerank: true
            })
          })

          if (matchRes.ok) {
            const data = await matchRes.json()
            matchInfo = await prisma.jobMatch.upsert({
              where: {
                userId_jobId: {
                  userId: session.userId,
                  jobId: job.id
                }
              },
              update: {
                matchScore: data.match_score,
                taxonomyScore: data.taxonomy_score,
                rerankScore: data.rerank_score,
                finalScore: data.final_score,
                explanationJson: data.explanation
              },
              create: {
                userId: session.userId,
                jobId: job.id,
                matchScore: data.match_score,
                taxonomyScore: data.taxonomy_score,
                rerankScore: data.rerank_score,
                finalScore: data.final_score,
                explanationJson: data.explanation
              }
            })
          }
        }
      } catch (err) {
        console.warn('On-demand job matching failed:', err)
      }
    }

    const exp: any = matchInfo?.explanationJson || {}
    const finalScore = matchInfo ? (matchInfo.finalScore ? Number(matchInfo.finalScore) : Number(matchInfo.matchScore)) : null

    return NextResponse.json({
      job: {
        ...job,
        matchScore: finalScore,
        baseScore: matchInfo?.matchScore ? Number(matchInfo.matchScore) : null,
        taxonomyScore: matchInfo?.taxonomyScore ? Number(matchInfo.taxonomyScore) : null,
        rerankScore: matchInfo?.rerankScore ? Number(matchInfo.rerankScore) : null,
        matchedSkills: exp.matched_skills || [],
        missingRequired: exp.missing_required || [],
        missingPreferred: exp.missing_preferred || [],
        taxonomyMatches: exp.taxonomy_matches || [],
        strengths: exp.strengths || [],
        gaps: exp.gaps || [],
        whyRankedHere: exp.why_ranked_here || '',
        fallbackUsed: exp.fallback_used ?? true,
        matchBreakdown: {
          exact: exp.factor_scores?.exact_skill || (matchInfo ? Math.round(Number(matchInfo.matchScore) * 0.9) : 75),
          semantic: exp.factor_scores?.semantic || 80,
          fresherFit: exp.factor_scores?.fresher_fit || 85,
          roleRelevance: exp.factor_scores?.role_relevance || 75,
          logistics: exp.factor_scores?.logistics || 80,
          recency: exp.factor_scores?.recency || 70,
          sourceConfidence: exp.factor_scores?.source_confidence || (job.confidenceScore ? Math.round(Number(job.confidenceScore) * 100) : 80),
          completeness: exp.factor_scores?.completeness || 85,
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
