import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { getAuthUser, signJWT } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getAuthUser(req)
  if (!session) {
    return NextResponse.json(
      { error: 'Session expired or user not found. Please sign in again.' },
      { status: 401 }
    )
  }
  
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'Only PDF files are accepted' }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File must be under 5MB' }, { status: 400 })
    }

    // Convert file to buffer for forwarding to Python service
    const buffer = Buffer.from(await file.arrayBuffer())
    
    let parsedData: any = {
      skills: [],
      target_roles: [],
      education: [],
      projects: [],
      experience: [],
      extracted_text: '',
    }

    const BACKEND_URL = process.env.BACKEND_URL || process.env.PYTHON_SERVICE_URL || 'http://localhost:8000'
    const API_KEY = process.env.INTERNAL_API_KEY || process.env.PYTHON_API_KEY || 'internal-secret-key'

    // 1. Forward to FastAPI service for parsing
    try {
      const pythonFormData = new FormData()
      pythonFormData.append('file', new Blob([buffer], { type: 'application/pdf' }), file.name)

      const response = await fetch(`${BACKEND_URL}/resume/parse`, {
        method: 'POST',
        headers: {
          'X-API-KEY': API_KEY,
        },
        body: pythonFormData,
      })

      if (response.ok) {
        parsedData = await response.json()
      } else {
        console.error(`Python backend parse failed with status ${response.status}:`, await response.text())
      }
    } catch (err) {
      console.error('Python backend unavailable:', err)
    }

    // 2. Generate vector embeddings if text extracted
    let embeddingVector: number[] | null = null
    if (parsedData.extracted_text) {
      try {
        const embedRes = await fetch(`${BACKEND_URL}/resume/embed`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': API_KEY,
          },
          body: JSON.stringify({ text: parsedData.extracted_text }),
        })
        if (embedRes.ok) {
          const embedData = await embedRes.json()
          embeddingVector = embedData.embedding || null
        }
      } catch (err) {
        console.warn('Embedding generation error:', err)
      }
    }

    // 3. Save Resume to database
    const isCompleted = Boolean(parsedData.extracted_text && parsedData.skills?.length > 0)
    const resume = await prisma.resume.create({
      data: {
        userId: session.userId,
        fileName: file.name,
        uploadStatus: isCompleted ? 'completed' : 'pending',
        extractedText: parsedData.extracted_text || null,
        skillsJson: parsedData.skills || [],
        educationJson: parsedData.education || [],
        projectsJson: parsedData.projects || [],
        parsedSections: {
          education: parsedData.education || [],
          projects: parsedData.projects || [],
          experience: parsedData.experience || [],
          target_roles: parsedData.target_roles || [],
        },
      },
    })

    // 4. Save pgvector embedding directly if available
    if (embeddingVector && embeddingVector.length > 0) {
      try {
        const vectorStr = `[${embeddingVector.join(',')}]`
        await prisma.$executeRawUnsafe(
          `UPDATE resumes SET embeddings_vector = $1::vector WHERE id = $2::uuid`,
          vectorStr,
          resume.id
        )
      } catch (err) {
        console.warn('Could not store pgvector embedding directly:', err)
      }
    }

    // 5. Link extracted skills to canonical taxonomy terms
    try {
      const allExtractedTerms = [...(parsedData.skills || []), ...(parsedData.target_roles || [])]
      for (const termName of allExtractedTerms) {
        const clean = termName.toLowerCase().trim()
        const matchedTerm = await prisma.taxonomyTerm.findFirst({
          where: {
            OR: [
              { preferredLabel: { equals: clean, mode: 'insensitive' } },
              { aliasesJson: { array_contains: clean } }
            ]
          }
        })

        if (matchedTerm) {
          await prisma.resumeTaxonomyLink.upsert({
            where: {
              resumeId_taxonomyTermId_linkType: {
                resumeId: resume.id,
                taxonomyTermId: matchedTerm.id,
                linkType: 'extracted_skill'
              }
            },
            update: {},
            create: {
              resumeId: resume.id,
              taxonomyTermId: matchedTerm.id,
              linkType: 'extracted_skill',
              confidenceScore: 0.95,
              sourceMethod: 'resume_extraction',
              evidenceText: `Extracted from resume: ${termName}`
            }
          })
        }
      }
    } catch (taxErr) {
      console.warn('Failed to link resume to taxonomy terms:', taxErr)
    }

    // 6. Update user with the current resume ID and inferred target roles
    const userUpdateData: any = {
      resumeId: resume.id,
    }

    if (parsedData.target_roles && parsedData.target_roles.length > 0) {
      userUpdateData.targetRoles = parsedData.target_roles
    }

    if (parsedData.education && parsedData.education.length > 0) {
      const primaryEdu = parsedData.education[0]
      if (primaryEdu.college && primaryEdu.college !== 'University / Engineering College') {
        userUpdateData.college = primaryEdu.college
      }
      if (primaryEdu.graduation_year) {
        userUpdateData.graduationYear = parseInt(primaryEdu.graduation_year)
      }
      if (primaryEdu.cgpa) {
        const cgpaNum = parseFloat(primaryEdu.cgpa)
        if (!isNaN(cgpaNum)) {
          userUpdateData.cgpa = cgpaNum
        }
      }
    }

    await prisma.user.update({
      where: { id: session.userId },
      data: userUpdateData,
    })

    // 6. Update user profile skills and headline from parsed resume
    if (parsedData.skills && parsedData.skills.length > 0) {
      const formattedSkills = parsedData.skills.map((skillName: string) => ({
        name: skillName,
        level: 'intermediate',
        category: 'Extracted Skill'
      }))

      const newHeadline = parsedData.target_roles?.length > 0
        ? `${parsedData.target_roles.map((r: string) => r.charAt(0).toUpperCase() + r.slice(1)).join(' / ')} Engineer`
        : 'Software Engineer'

      await prisma.userProfile.upsert({
        where: { userId: session.userId },
        update: {
          skillsJson: formattedSkills,
          headline: newHeadline,
        },
        create: {
          userId: session.userId,
          skillsJson: formattedSkills,
          headline: newHeadline,
        }
      })
    }

    const response = NextResponse.json({ resume, parsedData })
    // Refresh cookie with verified userId so stale client cookies are auto-fixed
    const refreshedToken = await signJWT({ userId: session.userId, email: session.email })
    response.cookies.set('token', refreshedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    })
    return response
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Error processing resume' },
      { status: 500 }
    )
  }
}
