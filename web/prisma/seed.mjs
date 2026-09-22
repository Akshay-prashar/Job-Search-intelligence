import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import bcrypt from 'bcryptjs'

const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/jobintel?schema=public'
const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Starting database seeding...')

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
      targetRoles: ['frontend', 'backend', 'fullstack'],
      preferredLocations: ['Bangalore', 'Hyderabad', 'Remote'],
      preferredWorkMode: 'remote',
      profile: {
        create: {
          headline: 'CS Senior | Full Stack Developer | Open Source Enthusiast',
          bio: 'Final year CS student passionate about building distributed web applications with React, TypeScript, and Node.js.',
          githubUrl: 'https://github.com/demo-fresher',
          linkedinUrl: 'https://linkedin.com/in/demo-fresher',
          skillsJson: ['react', 'typescript', 'javascript', 'python', 'postgresql', 'docker', 'git'],
          achievementsJson: ['Hackathon Finalist 2024', 'Open Source Contributor']
        }
      }
    }
  })
  console.log('✅ Demo user ready:', user.email)

  // 3. Seed Companies
  const companiesData = [
    {
      companyName: 'Stripe',
      domain: 'stripe.com',
      industry: 'Fintech',
      companySize: 'large',
      headquartersLocation: 'San Francisco, CA',
      sourceType: 'greenhouse',
      cultureTagsJson: ['engineering-first', 'documentation-driven', 'remote-friendly'],
      interviewStyleJson: { rounds: 4, types: ['coding', 'bug-hunt', 'system-design'], difficulty: 'hard' },
      fresherFriendly: true,
      publicHiringEmail: 'hiring@stripe.com'
    },
    {
      companyName: 'Cloudflare',
      domain: 'cloudflare.com',
      industry: 'Cybersecurity & Infrastructure',
      companySize: 'large',
      headquartersLocation: 'San Francisco, CA',
      sourceType: 'greenhouse',
      cultureTagsJson: ['systems-programming', 'open-source-friendly', 'highly-technical'],
      interviewStyleJson: { rounds: 3, types: ['coding', 'networking', 'behavioral'], difficulty: 'medium' },
      fresherFriendly: true,
      publicHiringEmail: 'jobs@cloudflare.com'
    },
    {
      companyName: 'Vercel',
      domain: 'vercel.com',
      industry: 'Cloud Infrastructure',
      companySize: 'mid',
      headquartersLocation: 'San Francisco, CA',
      sourceType: 'greenhouse',
      cultureTagsJson: ['remote-first', 'design-focused', 'fast-paced'],
      interviewStyleJson: { rounds: 4, types: ['coding-ui', 'take-home', 'behavioral'], difficulty: 'medium' },
      fresherFriendly: true,
      publicHiringEmail: 'careers@vercel.com'
    },
    {
      companyName: 'Razorpay',
      domain: 'razorpay.com',
      industry: 'Fintech',
      companySize: 'large',
      headquartersLocation: 'Bangalore, India',
      sourceType: 'manual',
      cultureTagsJson: ['fast-growing', 'high-ownership', 'collaborative'],
      interviewStyleJson: { rounds: 4, types: ['dsa', 'machine-coding', 'system-design'], difficulty: 'hard' },
      fresherFriendly: true,
      publicHiringEmail: 'freshers@razorpay.com'
    },
    {
      companyName: 'Postman',
      domain: 'postman.com',
      industry: 'DevTools',
      companySize: 'large',
      headquartersLocation: 'Bangalore, India',
      sourceType: 'manual',
      cultureTagsJson: ['api-first', 'product-focused', 'flexible'],
      interviewStyleJson: { rounds: 3, types: ['dsa', 'machine-coding', 'managerial'], difficulty: 'medium' },
      fresherFriendly: true,
      publicHiringEmail: 'careers@postman.com'
    }
  ]

  const seededCompanies = []
  for (const c of companiesData) {
    let record = await prisma.company.findFirst({ where: { domain: c.domain } })
    if (!record) {
      record = await prisma.company.create({ data: c })
    }
    seededCompanies.push(record)
  }
  console.log(`✅ Seeded ${seededCompanies.length} companies`)

  // 4. Seed Source Feeds
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

  // 5. Seed Jobs
  const stripeCompany = seededCompanies.find(c => c.companyName === 'Stripe')
  const vercelCompany = seededCompanies.find(c => c.companyName === 'Vercel')
  const cloudflareCompany = seededCompanies.find(c => c.companyName === 'Cloudflare')
  const razorpayCompany = seededCompanies.find(c => c.companyName === 'Razorpay')

  const sampleJobs = [
    {
      companyId: stripeCompany?.id,
      jobTitle: 'Software Engineering Intern - Summer 2025',
      roleType: 'backend',
      location: 'Bangalore, India',
      remoteType: 'hybrid',
      experienceLevel: 'intern',
      jobType: 'internship',
      department: 'Payments Infrastructure',
      description: 'Join Stripes payments engineering team as a software engineering intern. You will work on scalable distributed systems handling billions in transactions.',
      skillsJson: ['python', 'java', 'postgresql', 'distributed systems'],
      salaryRange: '₹80,000 - ₹1,20,000 / month',
      applyUrl: 'https://stripe.com/jobs',
      source: 'greenhouse',
      confidenceScore: 0.95
    },
    {
      companyId: vercelCompany?.id,
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
      companyId: cloudflareCompany?.id,
      jobTitle: 'Systems Software Engineer - New Grad',
      roleType: 'backend',
      location: 'San Francisco, CA',
      remoteType: 'onsite',
      experienceLevel: 'entry',
      jobType: 'full-time',
      department: 'Core Edge Systems',
      description: 'Build high-performance edge network systems using Rust, Go, and C++. Perfect for fresh computer science graduates with systems interest.',
      skillsJson: ['rust', 'golang', 'c++', 'linux', 'networking'],
      salaryRange: '$120,000 - $145,000',
      applyUrl: 'https://cloudflare.com/careers',
      source: 'greenhouse',
      confidenceScore: 0.92
    },
    {
      companyId: razorpayCompany?.id,
      jobTitle: 'Associate Software Development Engineer (SDE-1)',
      roleType: 'fullstack',
      location: 'Bangalore, India',
      remoteType: 'onsite',
      experienceLevel: 'entry',
      jobType: 'full-time',
      department: 'Merchant Platform',
      description: 'Join India top payment gateway team. Responsible for designing clean RESTful microservices, optimizing SQL queries, and collaborating with cross-functional teams.',
      skillsJson: ['react', 'node.js', 'postgresql', 'redis', 'docker'],
      salaryRange: '₹14,00,000 - ₹20,00,000',
      applyUrl: 'https://razorpay.com/jobs',
      source: 'manual',
      confidenceScore: 0.90
    }
  ]

  for (const j of sampleJobs) {
    const existing = await prisma.job.findFirst({ where: { jobTitle: j.jobTitle, companyId: j.companyId } })
    if (!existing) {
      const created = await prisma.job.create({ data: j })
      // Seed job requirements
      for (const s of (j.skillsJson || [])) {
        await prisma.jobRequirement.create({
          data: {
            jobId: created.id,
            skillName: s,
            requirementType: 'required',
            importanceLevel: 4
          }
        })
      }
    }
  }
  console.log('✅ Seeded sample jobs with requirements')

  // 6. Seed Interview Questions
  const interviewQuestions = [
    {
      companyId: stripeCompany?.id,
      roleType: 'backend',
      questionText: 'Design a distributed rate limiter in memory supporting token bucket algorithm for payment API endpoints.',
      questionType: 'coding',
      difficultyLevel: 'medium',
      source: 'manual',
      confidenceScore: 0.90
    },
    {
      companyId: vercelCompany?.id,
      roleType: 'frontend',
      questionText: 'Build an accessible, keyboard-navigable combobox component from scratch in React with virtualized list rendering.',
      questionType: 'coding',
      difficultyLevel: 'medium',
      source: 'manual',
      confidenceScore: 0.88
    },
    {
      companyId: razorpayCompany?.id,
      roleType: 'fullstack',
      questionText: 'Design a high-throughput webhook delivery system that guarantees at-least-once delivery with exponential backoff.',
      questionType: 'system-design',
      difficultyLevel: 'hard',
      source: 'manual',
      confidenceScore: 0.92
    }
  ]

  for (const q of interviewQuestions) {
    const existing = await prisma.interviewQuestion.findFirst({ where: { questionText: q.questionText } })
    if (!existing) {
      await prisma.interviewQuestion.create({ data: q })
    }
  }
  console.log('✅ Seeded interview questions')

  console.log('🎉 Database seeding script finished successfully!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
