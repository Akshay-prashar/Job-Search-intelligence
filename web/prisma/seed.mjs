import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5433/jobintel?schema=public'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting Research-Enhanced Database Seeding...')

  // 1. Seed Admin User
  const adminSalt = await bcrypt.genSalt(10)
  const adminHash = await bcrypt.hash('AdminPassword123', adminSalt)
  const admin = await prisma.adminUser.upsert({
    where: { email: 'admin@jobintel.com' },
    update: { passwordHash: adminHash },
    create: {
      name: 'System Admin',
      email: 'admin@jobintel.com',
      passwordHash: adminHash,
      role: 'superadmin'
    }
  })
  // Also ensure admin has a user record for regular dashboard access
  await prisma.user.upsert({
    where: { email: 'admin@jobintel.com' },
    update: { passwordHash: adminHash },
    create: {
      name: 'System Admin',
      email: 'admin@jobintel.com',
      passwordHash: adminHash,
      college: 'Administrator',
      branch: 'Platform Administration',
      graduationYear: 2024,
      cgpa: 10.0,
      targetRoles: ['fullstack', 'backend'],
      preferredLocations: ['Remote'],
      preferredWorkMode: 'remote'
    }
  })
  console.log('✅ Admin user ready:', admin.email)

  // 2. Seed Demo Fresher User
  const userSalt = await bcrypt.genSalt(10)
  const userHash = await bcrypt.hash('DemoPassword123', userSalt)
  const user = await prisma.user.upsert({
    where: { email: 'demo@jobintel.com' },
    update: {},
    create: {
      name: 'Rahul Sharma',
      email: 'demo@jobintel.com',
      passwordHash: userHash,
      college: 'National Institute of Technology',
      branch: 'Computer Science & Engineering',
      graduationYear: 2025,
      cgpa: 8.7,
      targetRoles: ['backend', 'frontend', 'fullstack'],
      preferredLocations: ['Bangalore', 'Hyderabad', 'Remote'],
      preferredWorkMode: 'remote',
      profile: {
        create: {
          headline: 'Full Stack & Backend Developer | Open Source Contributor',
          bio: 'Final year CS student passionate about building distributed web applications with React, TypeScript, Python, and PostgreSQL.',
          githubUrl: 'https://github.com/demo-fresher',
          linkedinUrl: 'https://linkedin.com/in/demo-fresher',
          skillsJson: [
            { name: 'react', level: 'advanced', category: 'Frameworks' },
            { name: 'typescript', level: 'advanced', category: 'Languages' },
            { name: 'python', level: 'intermediate', category: 'Languages' },
            { name: 'postgresql', level: 'intermediate', category: 'Databases' },
            { name: 'docker', level: 'intermediate', category: 'Tools' },
            { name: 'git', level: 'advanced', category: 'Tools' }
          ],
          achievementsJson: [{ title: 'Hackathon Finalist 2024', description: 'Built an AI vector search tool', date: '2024-11-15' }]
        }
      }
    }
  })
  console.log('✅ Demo user ready:', user.email)

  // 3. Seed Taxonomy Terms (ESCO baseline)
  const taxonomyPath = path.resolve(__dirname, '../../services/data/skill_taxonomy.json')
  let taxonomyMap = new Map() // skill_name -> taxonomy_term_id
  if (fs.existsSync(taxonomyPath)) {
    const rawTaxonomy = JSON.parse(fs.readFileSync(taxonomyPath, 'utf-8'))
    let taxCount = 0
    for (const [key, data] of Object.entries(rawTaxonomy)) {
      const externalId = data.external_id || `esco-skill-${taxCount + 1}`
      const term = await prisma.taxonomyTerm.upsert({
        where: {
          taxonomyName_externalId: {
            taxonomyName: 'esco',
            externalId: externalId
          }
        },
        update: {
          preferredLabel: data.preferred_label || key,
          description: data.description || '',
          aliasesJson: data.aliases || [],
          versionLabel: 'v1.1'
        },
        create: {
          taxonomyName: 'esco',
          externalId: externalId,
          termType: data.term_type || 'skill',
          preferredLabel: data.preferred_label || key,
          description: data.description || '',
          aliasesJson: data.aliases || [],
          versionLabel: 'v1.1'
        }
      })
      taxonomyMap.set(key.toLowerCase(), term.id)
      for (const alias of (data.aliases || [])) {
        taxonomyMap.set(alias.toLowerCase(), term.id)
      }
      taxCount++
    }
    console.log(`✅ Seeded ${taxCount} ESCO canonical taxonomy terms into taxonomy_terms`)
  }

  // 4. Seed Companies from company_seeds.json
  const companiesPath = path.resolve(__dirname, '../../services/data/company_seeds.json')
  let companyMap = new Map() // name -> company_id
  if (fs.existsSync(companiesPath)) {
    const companiesList = JSON.parse(fs.readFileSync(companiesPath, 'utf-8'))
    for (const c of companiesList) {
      const company = await prisma.company.upsert({
        where: { domain: c.domain },
        update: {
          companyName: c.company_name,
          industry: c.industry,
          companySize: c.company_size,
          headquartersLocation: c.headquarters_location,
          cultureTagsJson: c.culture_tags || [],
          interviewStyleJson: c.interview_style || {},
          engineeringBlogsJson: c.engineering_blogs || [],
          fresherFriendly: c.fresher_friendly ?? true,
          sourceType: c.greenhouse_board ? 'greenhouse' : (c.lever_slug ? 'lever' : 'manual')
        },
        create: {
          companyName: c.company_name,
          domain: c.domain,
          industry: c.industry,
          companySize: c.company_size,
          headquartersLocation: c.headquarters_location,
          cultureTagsJson: c.culture_tags || [],
          interviewStyleJson: c.interview_style || {},
          engineeringBlogsJson: c.engineering_blogs || [],
          fresherFriendly: c.fresher_friendly ?? true,
          sourceType: c.greenhouse_board ? 'greenhouse' : (c.lever_slug ? 'lever' : 'manual')
        }
      })
      companyMap.set(c.company_name.toLowerCase(), company.id)
    }
    console.log(`✅ Seeded ${companyMap.size} companies from company_seeds.json`)
  }

  // 5. Seed Source Feeds
  const feedsData = [
    { sourceName: 'Stripe Greenhouse', sourceType: 'greenhouse', sourceUrl: 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs', active: true, trustLevel: 'high' },
    { sourceName: 'Cloudflare Greenhouse', sourceType: 'greenhouse', sourceUrl: 'https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs', active: true, trustLevel: 'high' },
    { sourceName: 'Vercel Greenhouse', sourceType: 'greenhouse', sourceUrl: 'https://boards-api.greenhouse.io/v1/boards/vercel/jobs', active: true, trustLevel: 'high' },
    { sourceName: 'SimplifyJobs New Grad', sourceType: 'github', sourceUrl: 'https://github.com/SimplifyJobs/New-Grad-Positions', active: true, trustLevel: 'medium' },
    { sourceName: 'SimplifyJobs Internships', sourceType: 'github', sourceUrl: 'https://github.com/SimplifyJobs/Summer2025-Internships', active: true, trustLevel: 'medium' },
    { sourceName: 'Stripe Engineering RSS', sourceType: 'rss', sourceUrl: 'https://engineering.stripe.com/feed', active: true, trustLevel: 'medium' },
    { sourceName: 'Cloudflare Blog RSS', sourceType: 'rss', sourceUrl: 'https://blog.cloudflare.com/rss', active: true, trustLevel: 'medium' }
  ]

  for (const f of feedsData) {
    const existing = await prisma.sourceFeed.findFirst({ where: { sourceName: f.sourceName } })
    if (!existing) {
      await prisma.sourceFeed.create({ data: f })
    }
  }
  console.log('✅ Seeded source feeds')

  // 6. Seed Sample Jobs and Link to Taxonomy
  const stripeId = companyMap.get('stripe')
  const vercelId = companyMap.get('vercel')
  const cloudflareId = companyMap.get('cloudflare')
  const razorpayId = companyMap.get('razorpay')

  const sampleJobs = [
    {
      companyId: stripeId,
      jobTitle: 'Software Engineering Intern - Summer 2025',
      roleType: 'backend',
      location: 'Bangalore, India',
      remoteType: 'hybrid',
      experienceLevel: 'intern',
      jobType: 'internship',
      department: 'Payments Infrastructure',
      description: 'Join Stripes payments engineering team as a software engineering intern. You will work on scalable distributed systems handling billions in transactions with Python, Go, and PostgreSQL.',
      skillsJson: ['python', 'golang', 'postgresql', 'distributed systems'],
      salaryRange: '₹80,000 - ₹1,20,000 / month',
      applyUrl: 'https://stripe.com/jobs',
      source: 'greenhouse',
      confidenceScore: 0.95
    },
    {
      companyId: vercelId,
      jobTitle: 'Junior Frontend Developer',
      roleType: 'frontend',
      location: 'Remote',
      remoteType: 'remote',
      experienceLevel: 'entry',
      jobType: 'full-time',
      department: 'Design Engineering',
      description: 'We are looking for a Junior Frontend Developer with deep knowledge of React, Next.js, and TypeScript to build beautiful web experiences.',
      skillsJson: ['react', 'next.js', 'typescript', 'tailwind css'],
      salaryRange: '$80,000 - $110,000',
      applyUrl: 'https://vercel.com/careers',
      source: 'greenhouse',
      confidenceScore: 0.90
    },
    {
      companyId: cloudflareId,
      jobTitle: 'Systems Software Engineer - New Grad',
      roleType: 'backend',
      location: 'San Francisco, CA',
      remoteType: 'onsite',
      experienceLevel: 'entry',
      jobType: 'full-time',
      department: 'Core Edge Systems',
      description: 'Build high-performance edge network systems using Rust, Go, and C++. Perfect for fresh computer science graduates with systems interest.',
      skillsJson: ['rust', 'golang', 'c++', 'docker'],
      salaryRange: '$120,000 - $145,000',
      applyUrl: 'https://cloudflare.com/careers',
      source: 'greenhouse',
      confidenceScore: 0.92
    },
    {
      companyId: razorpayId,
      jobTitle: 'Associate Software Development Engineer (SDE-1)',
      roleType: 'fullstack',
      location: 'Bangalore, India',
      remoteType: 'onsite',
      experienceLevel: 'entry',
      jobType: 'full-time',
      department: 'Merchant Platform',
      description: 'Join Indias top payment gateway team. Responsible for designing clean RESTful microservices, optimizing SQL queries, and building web apps.',
      skillsJson: ['react', 'node.js', 'postgresql', 'redis', 'docker'],
      salaryRange: '₹14,00,000 - ₹20,00,000',
      applyUrl: 'https://razorpay.com/jobs',
      source: 'manual',
      confidenceScore: 0.90
    }
  ]

  for (const j of sampleJobs) {
    if (!j.companyId) continue
    let job = await prisma.job.findFirst({ where: { jobTitle: j.jobTitle, companyId: j.companyId } })
    if (!job) {
      job = await prisma.job.create({ data: j })
      // Seed job requirements
      for (const s of (j.skillsJson || [])) {
        await prisma.jobRequirement.create({
          data: {
            jobId: job.id,
            skillName: s,
            requirementType: 'required',
            importanceLevel: 4
          }
        })
      }
    }

    // Link job skills to taxonomy_terms
    for (const s of (j.skillsJson || [])) {
      const termId = taxonomyMap.get(s.toLowerCase())
      if (termId) {
        await prisma.jobTaxonomyLink.upsert({
          where: {
            jobId_taxonomyTermId_linkType: {
              jobId: job.id,
              taxonomyTermId: termId,
              linkType: 'required_skill'
            }
          },
          update: {},
          create: {
            jobId: job.id,
            taxonomyTermId: termId,
            linkType: 'required_skill',
            confidenceScore: 0.95,
            sourceMethod: 'exact_skill_match',
            evidenceText: `Required skill: ${s}`
          }
        })
      }
    }
  }
  console.log('✅ Seeded jobs with requirements & job_taxonomy_links')

  // 7. Seed Interview Questions from interview_seeds.json
  const interviewPath = path.resolve(__dirname, '../../services/data/interview_seeds.json')
  if (fs.existsSync(interviewPath)) {
    const questionsList = JSON.parse(fs.readFileSync(interviewPath, 'utf-8'))
    let qCount = 0
    for (const q of questionsList) {
      const cId = companyMap.get(q.company_name.toLowerCase())
      if (!cId) continue
      const existing = await prisma.interviewQuestion.findFirst({
        where: { questionText: q.question_text }
      })
      if (!existing) {
        await prisma.interviewQuestion.create({
          data: {
            companyId: cId,
            roleType: q.role_type,
            questionText: q.question_text,
            questionType: q.question_type,
            difficultyLevel: q.difficulty_level,
            source: q.source || 'manual',
            confidenceScore: 0.90
          }
        })
        qCount++
      }
    }
    console.log(`✅ Seeded ${qCount} interview questions from interview_seeds.json`)
  }

  console.log('🎉 Research-Enhanced Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
