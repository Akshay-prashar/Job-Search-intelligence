# Job Intelligence Platform for CS Freshers — Implementation Plan

A complete, free, production-style final-year college project that helps CS freshers discover, match, and track entry-level jobs and internships using explainable hybrid scoring, public data sources, and open-source AI.

\---

## Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Folder Structure](#2-folder-structure)
3. [Database Schema](#3-database-schema)
4. [Entity Relationships](#4-entity-relationships)
5. [Data Ingestion Pipeline](#5-data-ingestion-pipeline)
6. [Matching Algorithm Design](#6-matching-algorithm-design)
7. [API Design](#7-api-design)
8. [Frontend Page Design](#8-frontend-page-design)
9. [Admin Panel Design](#9-admin-panel-design)
10. [Privacy Design](#10-privacy-design)
11. [Seed Data Strategy](#11-seed-data-strategy)
12. [Deployment Plan](#12-deployment-plan)
13. [Demo Flow](#13-demo-flow)
14. [Final Report Content](#14-final-report-content)
15. [Future Scope](#15-future-scope)
16. [Implementation Phases \& Timeline](#16-implementation-phases--timeline)

\---

## 1\. System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph Client\["Client (Browser)"]
        NextApp\["Next.js App<br/>TypeScript + Tailwind CSS"]
    end

    subgraph NextServer\["Next.js Server (Node.js)"]
        APIRoutes\["API Routes<br/>/api/auth, /api/users, /api/jobs,<br/>/api/applications, /api/saved-jobs,<br/>/api/companies, /api/admin, /api/privacy"]
        AuthMiddleware\["Auth Middleware<br/>JWT / Supabase Auth"]
        CacheLayer\["In-Memory Cache<br/>node-cache / Redis-like"]
    end

    subgraph PythonService\["Python FastAPI Microservice"]
        ResumeParser\["Resume Parser<br/>PyMuPDF + pdfplumber"]
        EmbeddingEngine\["Embedding Engine<br/>all-MiniLM-L6-v2<br/>sentence-transformers"]
        MatchingEngine\["Matching Engine<br/>Hybrid Scorer"]
        Summarizer\["Summarizer<br/>Rule-based + extractive"]
        IngestionWorker\["Ingestion Workers<br/>Greenhouse, Lever, GitHub,<br/>HN, RSS, Manual"]
    end

    subgraph Database\["PostgreSQL + pgvector"]
        Tables\["18 Tables<br/>users, jobs, companies,<br/>resumes, matches, etc."]
        VectorIdx\["pgvector Indexes<br/>IVFFlat / HNSW"]
    end

    subgraph Storage\["File Storage"]
        LocalFS\["Local Filesystem<br/>or Supabase Storage (free)"]
    end

    subgraph ExternalAPIs\["Free Public Data Sources"]
        Greenhouse\["Greenhouse Job Board API"]
        Lever\["Lever Postings API"]
        GitHubAPI\["GitHub REST API"]
        HNAPI\["HN Algolia Search API"]
        RSSFeeds\["Engineering Blog RSS"]
        ManualSeed\["Manual Curated Data"]
    end

    subgraph Scheduler\["Task Scheduler"]
        Cron\["node-cron / APScheduler<br/>Ingestion Schedules"]
    end

    Client --> NextServer
    NextServer --> Database
    NextServer --> PythonService
    PythonService --> Database
    PythonService --> Storage
    Scheduler --> PythonService
    PythonService --> ExternalAPIs
```

### Component Responsibilities

|Component|Technology|Responsibility|
|-|-|-|
|**Frontend**|Next.js 14+, TypeScript, Tailwind CSS|UI rendering, SSR/SSG for SEO, client-side state|
|**Next.js API Routes**|Node.js (Next.js built-in)|Auth, CRUD for profiles/jobs/applications/saved-jobs, proxying to Python service|
|**Python Microservice**|FastAPI, Python 3.11+|Resume parsing, embeddings, matching, summarization, ingestion|
|**Database**|PostgreSQL 15+ with pgvector|All persistent data, vector similarity search|
|**File Storage**|Local FS or Supabase Storage (free tier)|Resume PDFs|
|**Scheduler**|APScheduler (Python) or node-cron|Scheduled ingestion runs|
|**Auth**|Supabase Auth (free tier) or custom JWT with bcrypt|User authentication|

### Communication Flow

```
Browser  ──HTTP/JSON──▶  Next.js API Routes  ──HTTP/JSON──▶  FastAPI Microservice
                              │                                      │
                              ▼                                      ▼
                         PostgreSQL ◀──────────────────────── PostgreSQL
                         (via Prisma ORM)                   (via SQLAlchemy/asyncpg)
```

> \[!NOTE]
> Both Next.js and FastAPI connect to the \*\*same PostgreSQL database\*\*. Next.js handles CRUD operations via Prisma ORM. FastAPI handles compute-heavy operations (parsing, embeddings, matching) via SQLAlchemy or raw asyncpg.

\---

## 2\. Folder Structure

### Monorepo Structure

```
job-intelligence-platform/
├── README.md
├── docker-compose.yml
├── .env.example
├── .gitignore
│
├── web/                              # Next.js Frontend + API Routes
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   ├── next.config.ts
│   ├── postcss.config.js
│   ├── .env.local.example
│   │
│   ├── prisma/
│   │   ├── schema.prisma             # Prisma schema for all 18 tables
│   │   └── migrations/               # Generated migration files
│   │
│   ├── public/
│   │   ├── favicon.ico
│   │   ├── logo.svg
│   │   └── images/
│   │
│   ├── src/
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── layout.tsx            # Root layout with providers
│   │   │   ├── page.tsx              # Landing page
│   │   │   ├── globals.css           # Tailwind directives + custom CSS
│   │   │   │
│   │   │   ├── (auth)/
│   │   │   │   ├── login/page.tsx
│   │   │   │   ├── register/page.tsx
│   │   │   │   └── layout.tsx
│   │   │   │
│   │   │   ├── (dashboard)/
│   │   │   │   ├── layout.tsx        # Dashboard shell with sidebar
│   │   │   │   ├── dashboard/page.tsx          # Job recommendations
│   │   │   │   ├── profile/page.tsx            # Profile setup
│   │   │   │   ├── resume/page.tsx             # Resume upload
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── page.tsx                # Job listing + search
│   │   │   │   │   └── \[id]/page.tsx           # Job detail
│   │   │   │   ├── saved/page.tsx              # Saved jobs
│   │   │   │   ├── applications/page.tsx       # Kanban tracker
│   │   │   │   ├── companies/
│   │   │   │   │   └── \[id]/page.tsx           # Company profile
│   │   │   │   ├── interviews/page.tsx         # Interview questions
│   │   │   │   ├── skills/page.tsx             # Skill gap analysis
│   │   │   │   └── settings/page.tsx           # Privacy \& settings
│   │   │   │
│   │   │   ├── (admin)/
│   │   │   │   ├── layout.tsx
│   │   │   │   └── admin/
│   │   │   │       ├── page.tsx                # Admin dashboard
│   │   │   │       ├── sources/page.tsx        # Source management
│   │   │   │       └── companies/page.tsx      # Company management
│   │   │   │
│   │   │   └── api/                  # Next.js API Routes
│   │   │       ├── auth/
│   │   │       │   ├── register/route.ts
│   │   │       │   ├── login/route.ts
│   │   │       │   └── logout/route.ts
│   │   │       ├── users/
│   │   │       │   └── me/route.ts
│   │   │       ├── resumes/
│   │   │       │   └── upload/route.ts
│   │   │       ├── jobs/
│   │   │       │   ├── route.ts                # GET /api/jobs (list + search)
│   │   │       │   ├── recommendations/route.ts
│   │   │       │   └── \[id]/
│   │   │       │       ├── route.ts            # GET /api/jobs/:id
│   │   │       │       └── save/route.ts       # POST /api/jobs/:id/save
│   │   │       ├── applications/
│   │   │       │   ├── route.ts
│   │   │       │   └── \[id]/route.ts
│   │   │       ├── companies/
│   │   │       │   └── \[id]/
│   │   │       │       ├── route.ts
│   │   │       │       ├── interviews/route.ts
│   │   │       │       └── insights/route.ts
│   │   │       ├── skills/
│   │   │       │   └── gap/route.ts
│   │   │       ├── admin/
│   │   │       │   ├── sources/route.ts
│   │   │       │   └── stats/route.ts
│   │   │       └── privacy/
│   │   │           └── delete-account/route.ts
│   │   │
│   │   ├── components/
│   │   │   ├── ui/                   # Reusable UI primitives
│   │   │   │   ├── Button.tsx
│   │   │   │   ├── Card.tsx
│   │   │   │   ├── Badge.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── Input.tsx
│   │   │   │   ├── Select.tsx
│   │   │   │   ├── Spinner.tsx
│   │   │   │   ├── Toast.tsx
│   │   │   │   ├── Pagination.tsx
│   │   │   │   ├── FilterChip.tsx
│   │   │   │   └── ProgressBar.tsx
│   │   │   │
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── DashboardShell.tsx
│   │   │   │
│   │   │   ├── jobs/
│   │   │   │   ├── JobCard.tsx
│   │   │   │   ├── JobDetailPanel.tsx
│   │   │   │   ├── MatchScoreBadge.tsx
│   │   │   │   ├── MatchExplanation.tsx
│   │   │   │   ├── SkillGapPanel.tsx
│   │   │   │   ├── JobFilters.tsx
│   │   │   │   └── JobSearchBar.tsx
│   │   │   │
│   │   │   ├── applications/
│   │   │   │   ├── KanbanBoard.tsx
│   │   │   │   ├── KanbanColumn.tsx
│   │   │   │   └── ApplicationCard.tsx
│   │   │   │
│   │   │   ├── companies/
│   │   │   │   ├── CompanyHeader.tsx
│   │   │   │   ├── CultureTags.tsx
│   │   │   │   ├── InsightCard.tsx
│   │   │   │   └── InterviewQuestionList.tsx
│   │   │   │
│   │   │   ├── profile/
│   │   │   │   ├── ProfileForm.tsx
│   │   │   │   ├── SkillSelector.tsx
│   │   │   │   └── EducationForm.tsx
│   │   │   │
│   │   │   ├── resume/
│   │   │   │   ├── ResumeUploader.tsx
│   │   │   │   ├── ParsedResumePreview.tsx
│   │   │   │   └── ConsentCheckbox.tsx
│   │   │   │
│   │   │   └── admin/
│   │   │       ├── SourceTable.tsx
│   │   │       ├── IngestionStatusPanel.tsx
│   │   │       └── StatsOverview.tsx
│   │   │
│   │   ├── lib/
│   │   │   ├── prisma.ts             # Prisma client singleton
│   │   │   ├── auth.ts              # Auth helpers (JWT / Supabase)
│   │   │   ├── api-client.ts        # Axios/fetch wrapper for Python service
│   │   │   ├── utils.ts             # Generic utilities
│   │   │   ├── constants.ts         # App constants, skill taxonomies
│   │   │   └── validators.ts        # Zod schemas for validation
│   │   │
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useJobs.ts
│   │   │   ├── useProfile.ts
│   │   │   └── useApplications.ts
│   │   │
│   │   ├── types/
│   │   │   ├── user.ts
│   │   │   ├── job.ts
│   │   │   ├── company.ts
│   │   │   ├── resume.ts
│   │   │   ├── application.ts
│   │   │   └── match.ts
│   │   │
│   │   └── middleware.ts             # Auth middleware for protected routes
│   │
│   └── tests/
│       ├── api/
│       └── components/
│
├── services/                         # Python FastAPI Microservice
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── pyproject.toml
│   ├── .env.example
│   │
│   ├── app/
│   │   ├── \_\_init\_\_.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Environment config
│   │   │
│   │   ├── api/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── routes/
│   │   │   │   ├── resume.py         # POST /parse, POST /embed
│   │   │   │   ├── matching.py       # POST /match, GET /explain
│   │   │   │   ├── ingestion.py      # POST /ingest/trigger, GET /status
│   │   │   │   └── summarize.py      # POST /summarize
│   │   │   └── deps.py              # Dependency injection
│   │   │
│   │   ├── core/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── database.py           # SQLAlchemy / asyncpg setup
│   │   │   ├── security.py           # Internal API key validation
│   │   │   └── logging.py
│   │   │
│   │   ├── models/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── schemas.py            # Pydantic request/response models
│   │   │   └── db\_models.py          # SQLAlchemy ORM models (if needed)
│   │   │
│   │   ├── services/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── resume\_parser.py      # PyMuPDF/pdfplumber text extraction
│   │   │   ├── resume\_extractor.py   # Structured data extraction (regex + heuristics)
│   │   │   ├── embedding\_service.py  # sentence-transformers embedding
│   │   │   ├── matching\_service.py   # Hybrid scoring engine
│   │   │   ├── summarizer.py         # Rule-based extractive summarizer
│   │   │   └── skill\_taxonomy.py     # Skill normalization \& synonym mapping
│   │   │
│   │   ├── ingestion/
│   │   │   ├── \_\_init\_\_.py
│   │   │   ├── scheduler.py          # APScheduler cron setup
│   │   │   ├── base\_fetcher.py       # Abstract base class for fetchers
│   │   │   ├── greenhouse\_fetcher.py
│   │   │   ├── lever\_fetcher.py
│   │   │   ├── github\_fetcher.py
│   │   │   ├── hn\_fetcher.py
│   │   │   ├── rss\_fetcher.py
│   │   │   ├── normalizer.py         # Raw → normalized job schema
│   │   │   ├── deduplicator.py       # Content-hash based dedup
│   │   │   └── embedding\_pipeline.py # Batch embedding generation
│   │   │
│   │   └── utils/
│   │       ├── \_\_init\_\_.py
│   │       ├── text\_cleaning.py
│   │       ├── skill\_extractor.py    # NLP-based skill extraction from text
│   │       └── html\_parser.py        # HTML → clean text
│   │
│   ├── data/
│   │   ├── skill\_taxonomy.json       # Master skill list + synonyms
│   │   ├── company\_seeds.json        # 30-50 seeded companies
│   │   └── interview\_seeds.json      # Seeded interview questions
│   │
│   └── tests/
│       ├── test\_resume\_parser.py
│       ├── test\_matching.py
│       ├── test\_ingestion.py
│       └── test\_normalizer.py
│
├── database/
│   ├── init.sql                      # Full schema DDL (18 tables)
│   ├── seed.sql                      # Seed data for demo
│   ├── indexes.sql                   # Indexes + pgvector indexes
│   └── migrations/                   # Versioned migrations
│
└── docs/
    ├── architecture.md
    ├── api-reference.md
    ├── data-sources.md
    ├── matching-algorithm.md
    ├── deployment-guide.md
    └── final-report-template.md
```

\---

## 3\. Database Schema

### Full DDL

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector";

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password\_hash       VARCHAR(255),           -- NULL if using OAuth/Supabase Auth
    auth\_provider\_id    VARCHAR(255),           -- External auth provider user ID
    college             VARCHAR(255),
    branch              VARCHAR(100),
    graduation\_year     INTEGER,
    cgpa                DECIMAL(4,2),
    target\_roles        JSONB DEFAULT '\[]',     -- e.g. \["frontend", "backend", "fullstack"]
    preferred\_locations JSONB DEFAULT '\[]',     -- e.g. \["Bangalore", "Remote"]
    preferred\_work\_mode VARCHAR(20) DEFAULT 'any'
                        CHECK (preferred\_work\_mode IN ('remote','onsite','hybrid','any')),
    resume\_id           UUID,                   -- FK added after resumes table
    created\_at          TIMESTAMPTZ DEFAULT NOW(),
    updated\_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. user\_profiles
-- ============================================================
CREATE TABLE user\_profiles (
    id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline          VARCHAR(255),
    bio               TEXT,
    github\_url        VARCHAR(512),
    linkedin\_url      VARCHAR(512),
    portfolio\_url     VARCHAR(512),
    current\_year      VARCHAR(20),              -- e.g. "4th year", "graduated"
    skills\_json       JSONB DEFAULT '\[]',       -- \[{name, level, category}]
    achievements\_json JSONB DEFAULT '\[]',       -- \[{title, description, date}]
    preferences\_json  JSONB DEFAULT '{}',       -- misc user preferences
    created\_at        TIMESTAMPTZ DEFAULT NOW(),
    updated\_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user\_id)
);

-- ============================================================
-- 3. resumes
-- ============================================================
CREATE TABLE resumes (
    id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file\_name         VARCHAR(255) NOT NULL,
    file\_url          VARCHAR(1024),
    mime\_type         VARCHAR(50) DEFAULT 'application/pdf',
    extracted\_text    TEXT,
    parsed\_sections   JSONB DEFAULT '{}',       -- {summary, experience, education, ...}
    skills\_json       JSONB DEFAULT '\[]',       -- extracted skills
    education\_json    JSONB DEFAULT '\[]',       -- \[{degree, college, year, cgpa}]
    projects\_json     JSONB DEFAULT '\[]',       -- \[{name, description, tech, url}]
    embeddings\_vector VECTOR(384),              -- all-MiniLM-L6-v2 = 384 dims
    upload\_status     VARCHAR(20) DEFAULT 'pending'
                      CHECK (upload\_status IN ('pending','processing','completed','failed')),
    created\_at        TIMESTAMPTZ DEFAULT NOW(),
    updated\_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from users.resume\_id → resumes.id
ALTER TABLE users
    ADD CONSTRAINT fk\_users\_resume
    FOREIGN KEY (resume\_id) REFERENCES resumes(id) ON DELETE SET NULL;

-- ============================================================
-- 4. companies
-- ============================================================
CREATE TABLE companies (
    id                     UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    company\_name           VARCHAR(255) NOT NULL,
    domain                 VARCHAR(255),          -- e.g. "stripe.com"
    logo\_url               VARCHAR(1024),
    industry               VARCHAR(100),
    company\_size           VARCHAR(50),            -- e.g. "startup", "mid", "large", "enterprise"
    headquarters\_location  VARCHAR(255),
    source\_type            VARCHAR(50),            -- "manual", "greenhouse", "lever", "github"
    culture\_tags\_json      JSONB DEFAULT '\[]',     -- \["remote-first", "open-source", "fast-paced"]
    interview\_style\_json   JSONB DEFAULT '{}',     -- {rounds, types, difficulty}
    engineering\_blogs\_json JSONB DEFAULT '\[]',     -- \[{url, title, last\_fetched}]
    fresher\_friendly       BOOLEAN DEFAULT FALSE,
    public\_hiring\_email    VARCHAR(255),           -- Only if publicly available
    created\_at             TIMESTAMPTZ DEFAULT NOW(),
    updated\_at             TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx\_companies\_domain ON companies(domain) WHERE domain IS NOT NULL;

-- ============================================================
-- 5. jobs
-- ============================================================
CREATE TABLE jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    company\_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    external\_job\_id         VARCHAR(255),
    job\_title               VARCHAR(500) NOT NULL,
    role\_type               VARCHAR(50),           -- "frontend", "backend", "fullstack", "devops", "data", "ml", "mobile"
    location                VARCHAR(255),
    remote\_type             VARCHAR(20) DEFAULT 'unknown'
                            CHECK (remote\_type IN ('remote','onsite','hybrid','unknown')),
    experience\_level        VARCHAR(30) DEFAULT 'entry'
                            CHECK (experience\_level IN ('intern','entry','junior','mid','unknown')),
    job\_type                VARCHAR(30),           -- "full-time", "internship", "contract", "part-time"
    department              VARCHAR(255),
    description             TEXT,
    responsibilities        TEXT,
    minimum\_qualifications  TEXT,
    preferred\_qualifications TEXT,
    skills\_json             JSONB DEFAULT '\[]',    -- normalized skill list
    salary\_range            VARCHAR(100),          -- "₹4-6 LPA" or "$60k-$80k"
    apply\_url               VARCHAR(1024),
    source                  VARCHAR(50) NOT NULL,  -- "greenhouse", "lever", "github", "manual"
    source\_url              VARCHAR(1024),
    posted\_at               TIMESTAMPTZ,
    expiry\_date             TIMESTAMPTZ,
    confidence\_score        DECIMAL(3,2) DEFAULT 0.50,  -- 0.00–1.00
    embeddings\_vector       VECTOR(384),
    content\_hash            VARCHAR(64),           -- SHA-256 for dedup
    duplicate\_of\_job\_id     UUID REFERENCES jobs(id) ON DELETE SET NULL,
    job\_status              VARCHAR(20) DEFAULT 'active'
                            CHECK (job\_status IN ('active','expired','duplicate','removed')),
    created\_at              TIMESTAMPTZ DEFAULT NOW(),
    updated\_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_jobs\_company ON jobs(company\_id);
CREATE INDEX idx\_jobs\_status ON jobs(job\_status);
CREATE INDEX idx\_jobs\_source ON jobs(source);
CREATE INDEX idx\_jobs\_experience ON jobs(experience\_level);
CREATE INDEX idx\_jobs\_posted ON jobs(posted\_at DESC);
CREATE INDEX idx\_jobs\_content\_hash ON jobs(content\_hash);

-- ============================================================
-- 6. job\_requirements
-- ============================================================
CREATE TABLE job\_requirements (
    id               UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    job\_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill\_name       VARCHAR(100) NOT NULL,
    requirement\_type VARCHAR(20) DEFAULT 'required'
                     CHECK (requirement\_type IN ('required','preferred','nice-to-have')),
    importance\_level INTEGER DEFAULT 3 CHECK (importance\_level BETWEEN 1 AND 5),
    is\_mandatory     BOOLEAN DEFAULT FALSE,
    created\_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_jobreq\_job ON job\_requirements(job\_id);

-- ============================================================
-- 7. applications
-- ============================================================
CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job\_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status          VARCHAR(30) DEFAULT 'to\_apply'
                    CHECK (status IN ('to\_apply','applied','interviewing','rejected','offer','withdrawn')),
    applied\_at      TIMESTAMPTZ,
    follow\_up\_date  DATE,
    notes           TEXT,
    interview\_stage VARCHAR(100),
    result          VARCHAR(50),
    created\_at      TIMESTAMPTZ DEFAULT NOW(),
    updated\_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user\_id, job\_id)
);

CREATE INDEX idx\_applications\_user ON applications(user\_id);

-- ============================================================
-- 8. saved\_jobs
-- ============================================================
CREATE TABLE saved\_jobs (
    id        UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job\_id    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved\_at  TIMESTAMPTZ DEFAULT NOW(),
    created\_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user\_id, job\_id)
);

CREATE INDEX idx\_saved\_user ON saved\_jobs(user\_id);

-- ============================================================
-- 9. job\_matches
-- ============================================================
CREATE TABLE job\_matches (
    id                      UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job\_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match\_score             DECIMAL(5,2) NOT NULL,   -- 0–100 composite
    exact\_match\_score       DECIMAL(5,2),
    semantic\_score          DECIMAL(5,2),
    fresher\_fit\_score       DECIMAL(5,2),
    logistics\_score         DECIMAL(5,2),
    source\_confidence\_score DECIMAL(5,2),
    recency\_score           DECIMAL(5,2),
    completeness\_score      DECIMAL(5,2),
    role\_relevance\_score    DECIMAL(5,2),
    explanation\_json        JSONB DEFAULT '{}',       -- full human-readable explanation
    created\_at              TIMESTAMPTZ DEFAULT NOW(),
    updated\_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user\_id, job\_id)
);

CREATE INDEX idx\_matches\_user\_score ON job\_matches(user\_id, match\_score DESC);

-- ============================================================
-- 10. company\_insights
-- ============================================================
CREATE TABLE company\_insights (
    id               UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    company\_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source           VARCHAR(50) NOT NULL,     -- "hn", "github", "rss", "manual"
    insight\_type     VARCHAR(50) NOT NULL,     -- "culture", "interview", "engineering", "hiring"
    raw\_text         TEXT,
    summarized\_text  TEXT,
    tags\_json        JSONB DEFAULT '\[]',
    confidence\_score DECIMAL(3,2) DEFAULT 0.50,
    created\_at       TIMESTAMPTZ DEFAULT NOW(),
    updated\_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_insights\_company ON company\_insights(company\_id);

-- ============================================================
-- 11. interview\_questions
-- ============================================================
CREATE TABLE interview\_questions (
    id               UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    company\_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
    role\_type        VARCHAR(50),
    question\_text    TEXT NOT NULL,
    question\_type    VARCHAR(30),              -- "coding", "system-design", "behavioral", "hr"
    difficulty\_level VARCHAR(20),              -- "easy", "medium", "hard"
    source           VARCHAR(50),
    source\_url       VARCHAR(1024),
    confidence\_score DECIMAL(3,2) DEFAULT 0.50,
    created\_at       TIMESTAMPTZ DEFAULT NOW(),
    updated\_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_iq\_company ON interview\_questions(company\_id);

-- ============================================================
-- 12. hiring\_notes
-- ============================================================
CREATE TABLE hiring\_notes (
    id               UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    company\_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    note\_type        VARCHAR(50),              -- "process", "timeline", "tip", "warning"
    note\_text        TEXT NOT NULL,
    source           VARCHAR(50),
    source\_url       VARCHAR(1024),
    confidence\_score DECIMAL(3,2) DEFAULT 0.50,
    created\_at       TIMESTAMPTZ DEFAULT NOW(),
    updated\_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_hn\_company ON hiring\_notes(company\_id);

-- ============================================================
-- 13. source\_feeds
-- ============================================================
CREATE TABLE source\_feeds (
    id              UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    source\_name     VARCHAR(100) NOT NULL,
    source\_type     VARCHAR(50) NOT NULL,      -- "greenhouse", "lever", "github", "hn", "rss", "manual"
    source\_url      VARCHAR(1024) NOT NULL,
    active          BOOLEAN DEFAULT TRUE,
    last\_fetched\_at TIMESTAMPTZ,
    fetch\_frequency VARCHAR(50) DEFAULT 'daily',  -- "hourly", "daily", "weekly"
    rate\_limit\_notes TEXT,
    trust\_level     VARCHAR(20) DEFAULT 'medium'
                    CHECK (trust\_level IN ('high','medium','low')),
    created\_at      TIMESTAMPTZ DEFAULT NOW(),
    updated\_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. raw\_ingestions
-- ============================================================
CREATE TABLE raw\_ingestions (
    id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    source\_feed\_id    UUID NOT NULL REFERENCES source\_feeds(id) ON DELETE CASCADE,
    external\_id       VARCHAR(255),
    raw\_payload       JSONB,
    raw\_text          TEXT,
    content\_hash      VARCHAR(64),
    fetched\_at        TIMESTAMPTZ DEFAULT NOW(),
    processed\_at      TIMESTAMPTZ,
    processing\_status VARCHAR(20) DEFAULT 'pending'
                      CHECK (processing\_status IN ('pending','processing','completed','failed','skipped')),
    error\_message     TEXT
);

CREATE INDEX idx\_raw\_source ON raw\_ingestions(source\_feed\_id);
CREATE INDEX idx\_raw\_status ON raw\_ingestions(processing\_status);
CREATE INDEX idx\_raw\_hash ON raw\_ingestions(content\_hash);

-- ============================================================
-- 15. duplicate\_groups
-- ============================================================
CREATE TABLE duplicate\_groups (
    id               UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    canonical\_job\_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    duplicate\_count  INTEGER DEFAULT 0,
    duplicate\_reason VARCHAR(100),             -- "content\_hash", "title\_company\_match", "url\_match"
    created\_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. notifications
-- ============================================================
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification\_type VARCHAR(50),             -- "new\_match", "stale\_job", "application\_update"
    title             VARCHAR(255),
    message           TEXT,
    read\_status       BOOLEAN DEFAULT FALSE,
    created\_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_notif\_user ON notifications(user\_id, read\_status);

-- ============================================================
-- 17. admin\_users
-- ============================================================
CREATE TABLE admin\_users (
    id         UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password\_hash VARCHAR(255) NOT NULL,
    role       VARCHAR(20) DEFAULT 'admin'
               CHECK (role IN ('admin','superadmin','viewer')),
    created\_at TIMESTAMPTZ DEFAULT NOW(),
    updated\_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. privacy\_logs
-- ============================================================
CREATE TABLE privacy\_logs (
    id          UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),
    user\_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action\_type VARCHAR(50) NOT NULL,         -- "resume\_upload", "resume\_delete", "account\_delete",
                                              -- "data\_export", "consent\_given", "consent\_revoked"
    details     JSONB DEFAULT '{}',
    created\_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx\_privacy\_user ON privacy\_logs(user\_id);

-- ============================================================
-- Vector Indexes (pgvector)
-- ============================================================
-- Use IVFFlat for moderate-scale data (< 1M vectors)
-- Switch to HNSW for better recall if needed

CREATE INDEX idx\_jobs\_embedding ON jobs
    USING ivfflat (embeddings\_vector vector\_cosine\_ops)
    WITH (lists = 100);

CREATE INDEX idx\_resumes\_embedding ON resumes
    USING ivfflat (embeddings\_vector vector\_cosine\_ops)
    WITH (lists = 50);

-- ============================================================
-- Updated-at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update\_updated\_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated\_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg\_users\_updated BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_profiles\_updated BEFORE UPDATE ON user\_profiles
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_resumes\_updated BEFORE UPDATE ON resumes
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_companies\_updated BEFORE UPDATE ON companies
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_jobs\_updated BEFORE UPDATE ON jobs
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_applications\_updated BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
CREATE TRIGGER trg\_matches\_updated BEFORE UPDATE ON job\_matches
    FOR EACH ROW EXECUTE FUNCTION update\_updated\_at();
```

\---

## 4\. Entity Relationships

```mermaid
erDiagram
    users ||--o| user\_profiles : "has one"
    users ||--o{ resumes : "uploads"
    users ||--o{ applications : "tracks"
    users ||--o{ saved\_jobs : "saves"
    users ||--o{ job\_matches : "receives"
    users ||--o{ notifications : "gets"
    users ||--o{ privacy\_logs : "logs"

    companies ||--o{ jobs : "posts"
    companies ||--o{ company\_insights : "has"
    companies ||--o{ interview\_questions : "has"
    companies ||--o{ hiring\_notes : "has"

    jobs ||--o{ job\_requirements : "requires"
    jobs ||--o{ applications : "applied to"
    jobs ||--o{ saved\_jobs : "saved"
    jobs ||--o{ job\_matches : "matched"
    jobs ||--o| duplicate\_groups : "canonical of"

    source\_feeds ||--o{ raw\_ingestions : "produces"

    users {
        UUID id PK
        VARCHAR name
        VARCHAR email
        UUID resume\_id FK
    }
    user\_profiles {
        UUID id PK
        UUID user\_id FK
        JSONB skills\_json
    }
    resumes {
        UUID id PK
        UUID user\_id FK
        VECTOR embeddings\_vector
    }
    companies {
        UUID id PK
        VARCHAR company\_name
        VARCHAR domain
    }
    jobs {
        UUID id PK
        UUID company\_id FK
        VARCHAR job\_title
        VARCHAR source
        DECIMAL confidence\_score
        VECTOR embeddings\_vector
    }
    job\_matches {
        UUID id PK
        UUID user\_id FK
        UUID job\_id FK
        DECIMAL match\_score
        JSONB explanation\_json
    }
    applications {
        UUID id PK
        UUID user\_id FK
        UUID job\_id FK
        VARCHAR status
    }
```

\---

## 5\. Data Ingestion Pipeline

### Architecture

```mermaid
flowchart LR
    subgraph Sources\["Public Data Sources"]
        GH\["Greenhouse API"]
        LV\["Lever API"]
        GIT\["GitHub REST API"]
        HN\["HN Algolia API"]
        RSS\["RSS Feeds"]
        MAN\["Manual Seeds"]
    end

    subgraph Fetch\["1. Fetch"]
        F1\["greenhouse\_fetcher.py"]
        F2\["lever\_fetcher.py"]
        F3\["github\_fetcher.py"]
        F4\["hn\_fetcher.py"]
        F5\["rss\_fetcher.py"]
    end

    subgraph Store\["2. Store Raw"]
        RAW\["raw\_ingestions table<br/>raw\_payload JSONB"]
    end

    subgraph Normalize\["3. Normalize"]
        NORM\["normalizer.py<br/>→ jobs table schema"]
    end

    subgraph Dedup\["4. Deduplicate"]
        DD\["deduplicator.py<br/>content\_hash + title match"]
    end

    subgraph Embed\["5. Embed"]
        EMB\["embedding\_pipeline.py<br/>all-MiniLM-L6-v2"]
    end

    subgraph Match\["6. Match"]
        MATCH\["matching\_service.py<br/>Recompute scores for active users"]
    end

    Sources --> Fetch --> Store --> Normalize --> Dedup --> Embed --> Match
```

### Source-Specific Fetcher Details

#### Greenhouse Job Board API

```python
# Endpoint pattern: https://boards-api.greenhouse.io/v1/boards/{board\_token}/jobs
# Returns: { jobs: \[{ id, title, location, departments, offices, content, absolute\_url }] }
# Rate limit: \~50 req/min (undocumented, be conservative)
# Confidence: HIGH (0.90)

class GreenhouseFetcher(BaseFetcher):
    BASE\_URL = "https://boards-api.greenhouse.io/v1/boards"

    async def fetch(self, board\_token: str) -> list\[dict]:
        url = f"{self.BASE\_URL}/{board\_token}/jobs?content=true"
        response = await self.http\_get(url)
        raw\_jobs = response.json().get("jobs", \[])

        for job in raw\_jobs:
            await self.store\_raw(
                source\_feed\_id=self.feed\_id,
                external\_id=str(job\["id"]),
                raw\_payload=job,
                content\_hash=self.hash\_content(job)
            )
        return raw\_jobs
```

**Seeded Greenhouse boards (examples):**

|Company|Board Token|
|-|-|
|Stripe|`stripe`|
|Cloudflare|`cloudflare`|
|Figma|`figma`|
|Notion|`notion`|
|Vercel|`vercel`|
|Linear|`linear`|
|Coinbase|`coinbase`|
|DoorDash|`doordash`|

#### Lever Postings API

```python
# Endpoint pattern: https://api.lever.co/v0/postings/{company\_slug}
# Returns: \[{ id, text, descriptionPlain, categories, lists, applyUrl, ... }]
# Rate limit: Moderate, respect 429s
# Confidence: HIGH (0.90)

class LeverFetcher(BaseFetcher):
    BASE\_URL = "https://api.lever.co/v0/postings"

    async def fetch(self, company\_slug: str) -> list\[dict]:
        url = f"{self.BASE\_URL}/{company\_slug}"
        response = await self.http\_get(url)
        raw\_jobs = response.json()

        for job in raw\_jobs:
            await self.store\_raw(
                source\_feed\_id=self.feed\_id,
                external\_id=job\["id"],
                raw\_payload=job,
                content\_hash=self.hash\_content(job)
            )
        return raw\_jobs
```

#### GitHub REST API

```python
# Used for curated lists, NOT for scraping
# Example repos:
#   - SimplifyJobs/New-Grad-Positions (markdown table)
#   - pittcsc/Summer2025-Internships (markdown table)
#   - yangshun/tech-interview-handbook (interview questions)
# Endpoint: https://api.github.com/repos/{owner}/{repo}/contents/{path}
# Returns: { content: "<base64>", encoding: "base64" }
# Rate limit: 60 req/hr unauthenticated, 5000 req/hr with token
# Confidence: MEDIUM (0.70)

class GitHubFetcher(BaseFetcher):
    BASE\_URL = "https://api.github.com"

    async def fetch\_readme(self, owner: str, repo: str, path: str = "README.md"):
        url = f"{self.BASE\_URL}/repos/{owner}/{repo}/contents/{path}"
        headers = {"Accept": "application/vnd.github.v3+json"}
        if self.github\_token:
            headers\["Authorization"] = f"Bearer {self.github\_token}"
        response = await self.http\_get(url, headers=headers)
        data = response.json()
        content = base64.b64decode(data\["content"]).decode("utf-8")
        # Parse markdown table rows into job listings
        return self.parse\_markdown\_table(content)
```

#### Hacker News Algolia Search API

```python
# Endpoint: https://hn.algolia.com/api/v1/search?query={query}\&tags=story
# Used for community insights, NOT job listings
# Queries: "\[company] interview", "\[company] new grad", "\[company] culture"
# Rate limit: 10,000 req/hr
# Confidence: LOW-MEDIUM (0.40–0.60)

class HNFetcher(BaseFetcher):
    BASE\_URL = "https://hn.algolia.com/api/v1/search"

    async def fetch\_insights(self, company\_name: str):
        queries = \[
            f"{company\_name} interview",
            f"{company\_name} new grad",
            f"{company\_name} internship",
            f"{company\_name} engineering culture",
        ]
        results = \[]
        for query in queries:
            url = f"{self.BASE\_URL}?query={quote(query)}\&tags=story\&hitsPerPage=5"
            response = await self.http\_get(url)
            hits = response.json().get("hits", \[])
            for hit in hits:
                results.append({
                    "title": hit.get("title"),
                    "url": hit.get("url") or f"https://news.ycombinator.com/item?id={hit\['objectID']}",
                    "points": hit.get("points"),
                    "num\_comments": hit.get("num\_comments"),
                    "created\_at": hit.get("created\_at"),
                    "query\_type": query,
                })
        return results
```

#### RSS Feed Fetcher

```python
# Use feedparser library to parse RSS/Atom feeds
# Example engineering blogs:
#   - https://engineering.stripe.com/feed
#   - https://blog.cloudflare.com/rss
#   - https://netflixtechblog.com/feed
# Confidence: MEDIUM (0.60) — context data, not hiring

class RSSFetcher(BaseFetcher):
    async def fetch(self, feed\_url: str):
        feed = feedparser.parse(feed\_url)
        entries = \[]
        for entry in feed.entries\[:10]:  # Last 10 posts
            entries.append({
                "title": entry.get("title"),
                "link": entry.get("link"),
                "published": entry.get("published"),
                "summary": entry.get("summary", "")\[:500],
            })
        return entries
```

### Ingestion Schedule

|Source|Frequency|Rate Limit Strategy|
|-|-|-|
|Greenhouse|Every 6 hours|1 req/sec per company, batch sequentially|
|Lever|Every 6 hours|1 req/sec per company, respect 429|
|GitHub|Daily|Use auth token (5k/hr), 1 req/2sec|
|HN Algolia|Daily|Very generous (10k/hr), 1 req/sec|
|RSS|Daily|Standard HTTP, 1 req/sec|
|Manual Seeds|On startup / admin trigger|N/A|

### Normalization Pipeline

```python
class JobNormalizer:
    """Converts raw payloads from any source into the normalized job schema."""

    def normalize\_greenhouse(self, raw: dict) -> NormalizedJob:
        return NormalizedJob(
            external\_job\_id=str(raw\["id"]),
            job\_title=raw\["title"],
            location=self.\_extract\_location(raw.get("location", {})),
            department=self.\_first\_department(raw.get("departments", \[])),
            description=self.\_clean\_html(raw.get("content", "")),
            apply\_url=raw.get("absolute\_url"),
            source="greenhouse",
            confidence\_score=0.90,
            posted\_at=self.\_parse\_date(raw.get("updated\_at")),
            skills\_json=self.\_extract\_skills\_from\_text(raw.get("content", "")),
            experience\_level=self.\_detect\_experience\_level(raw),
            remote\_type=self.\_detect\_remote(raw),
            role\_type=self.\_detect\_role\_type(raw.get("title", ""), raw.get("content", "")),
        )

    def normalize\_lever(self, raw: dict) -> NormalizedJob:
        categories = raw.get("categories", {})
        return NormalizedJob(
            external\_job\_id=raw\["id"],
            job\_title=raw.get("text", ""),
            location=categories.get("location", ""),
            department=categories.get("department", ""),
            description=raw.get("descriptionPlain", ""),
            apply\_url=raw.get("applyUrl") or raw.get("hostedUrl"),
            source="lever",
            confidence\_score=0.90,
            posted\_at=self.\_parse\_timestamp\_ms(raw.get("createdAt")),
            skills\_json=self.\_extract\_skills\_from\_text(raw.get("descriptionPlain", "")),
            experience\_level=self.\_detect\_experience\_level\_text(raw.get("text", ""), raw.get("descriptionPlain", "")),
            remote\_type=self.\_detect\_remote\_text(categories.get("location", "")),
            role\_type=self.\_detect\_role\_type(raw.get("text", ""), raw.get("descriptionPlain", "")),
        )
```

### Deduplication Strategy

```python
class Deduplicator:
    """Identifies and marks duplicate job postings."""

    def compute\_content\_hash(self, job: NormalizedJob) -> str:
        """SHA-256 hash of normalized title + company + location."""
        canonical = f"{job.job\_title.lower().strip()}|{job.company\_name.lower().strip()}|{job.location.lower().strip()}"
        return hashlib.sha256(canonical.encode()).hexdigest()

    async def check\_duplicate(self, job: NormalizedJob) -> Optional\[UUID]:
        """Returns canonical job ID if duplicate found, else None."""
        # Strategy 1: Exact content hash match
        existing = await self.db.find\_job\_by\_hash(job.content\_hash)
        if existing:
            return existing.id

        # Strategy 2: Same title + company within 30 days
        existing = await self.db.find\_similar\_job(
            title=job.job\_title,
            company=job.company\_name,
            days\_window=30
        )
        if existing:
            return existing.id

        return None
```

\---

## 6\. Matching Algorithm Design

### Hybrid Scoring Pipeline

```mermaid
flowchart TB
    subgraph Input
        RESUME\["User Resume<br/>(parsed + embedded)"]
        PROFILE\["User Profile<br/>(skills, prefs, location)"]
        JOB\["Job Listing<br/>(parsed + embedded)"]
    end

    subgraph Factors\["Scoring Factors (8)"]
        F1\["1. Exact Skill Match<br/>Weight: 0.25"]
        F2\["2. Semantic Similarity<br/>Weight: 0.20"]
        F3\["3. Fresher Fit<br/>Weight: 0.15"]
        F4\["4. Logistics Fit<br/>Weight: 0.10"]
        F5\["5. Recency<br/>Weight: 0.10"]
        F6\["6. Source Confidence<br/>Weight: 0.05"]
        F7\["7. Resume Completeness<br/>Weight: 0.05"]
        F8\["8. Role Relevance<br/>Weight: 0.10"]
    end

    subgraph Output
        SCORE\["Composite Score<br/>(0–100)"]
        EXPLAIN\["Explanation JSON<br/>human-readable breakdown"]
    end

    Input --> Factors --> Output
```

### Detailed Scoring Logic

```python
class HybridMatcher:
    """Computes an explainable match score between a user and a job."""

    # Weight configuration (tunable)
    WEIGHTS = {
        "exact\_skill":       0.25,
        "semantic":          0.20,
        "fresher\_fit":       0.15,
        "role\_relevance":    0.10,
        "logistics":         0.10,
        "recency":           0.10,
        "source\_confidence": 0.05,
        "completeness":      0.05,
    }

    def compute\_match(self, user: UserProfile, resume: ParsedResume, job: NormalizedJob) -> MatchResult:
        scores = {}
        explanations = {}

        # ── 1. Exact Skill Match (0–100) ──
        user\_skills = set(normalize\_skill(s) for s in resume.skills + user.skills)
        job\_required = set(normalize\_skill(s) for s in job.required\_skills)
        job\_preferred = set(normalize\_skill(s) for s in job.preferred\_skills)
        job\_all = job\_required | job\_preferred

        matched = user\_skills \& job\_all
        missing\_required = job\_required - user\_skills
        missing\_preferred = job\_preferred - user\_skills

        if len(job\_all) > 0:
            scores\["exact\_skill"] = (len(matched) / len(job\_all)) \* 100
        else:
            scores\["exact\_skill"] = 50  # No skills listed → neutral

        explanations\["matched\_skills"] = sorted(matched)
        explanations\["missing\_required"] = sorted(missing\_required)
        explanations\["missing\_preferred"] = sorted(missing\_preferred)

        # ── 2. Semantic Similarity (0–100) ──
        if resume.embedding is not None and job.embedding is not None:
            cosine\_sim = cosine\_similarity(resume.embedding, job.embedding)
            scores\["semantic"] = max(0, min(100, cosine\_sim \* 100))
        else:
            scores\["semantic"] = 0

        # ── 3. Fresher Fit (0–100) ──
        scores\["fresher\_fit"], explanations\["fresher\_fit\_reason"] = self.\_compute\_fresher\_fit(job)

        # ── 4. Role Relevance (0–100) ──
        scores\["role\_relevance"] = self.\_compute\_role\_relevance(user.target\_roles, job.role\_type)

        # ── 5. Logistics Fit (0–100) ──
        scores\["logistics"], explanations\["logistics\_reason"] = self.\_compute\_logistics(
            user.preferred\_locations, user.preferred\_work\_mode, job
        )

        # ── 6. Recency (0–100) ──
        scores\["recency"] = self.\_compute\_recency(job.posted\_at)

        # ── 7. Source Confidence (0–100) ──
        scores\["source\_confidence"] = job.confidence\_score \* 100
        explanations\["source\_label"] = self.\_source\_label(job.source)
        explanations\["confidence\_level"] = self.\_confidence\_level(job.confidence\_score)

        # ── 8. Resume Completeness (0–100) ──
        scores\["completeness"] = self.\_compute\_completeness(resume)

        # ── Composite Score ──
        composite = sum(
            scores\[factor] \* weight
            for factor, weight in self.WEIGHTS.items()
        )
        composite = round(min(100, max(0, composite)), 1)

        return MatchResult(
            match\_score=composite,
            factor\_scores=scores,
            explanation=explanations,
        )

    def \_compute\_fresher\_fit(self, job: NormalizedJob) -> tuple\[float, str]:
        """Scores how suitable this job is for a fresher."""
        score = 50  # neutral baseline
        reason = "No explicit experience signal"

        title\_lower = job.job\_title.lower()
        desc\_lower = (job.description or "").lower()

        # Positive signals
        fresher\_keywords = \["intern", "new grad", "entry level", "junior", "fresher",
                           "associate", "trainee", "graduate", "campus", "0-1 year",
                           "0-2 year", "no experience required"]
        for kw in fresher\_keywords:
            if kw in title\_lower or kw in desc\_lower:
                score = 90
                reason = f"Job mentions '{kw}' — strong fresher fit"
                break

        # Negative signals
        senior\_keywords = \["senior", "lead", "principal", "staff", "architect",
                          "manager", "director", "5+ years", "7+ years", "10+ years"]
        for kw in senior\_keywords:
            if kw in title\_lower or kw in desc\_lower:
                score = 10
                reason = f"Job mentions '{kw}' — likely not for freshers"
                break

        if job.experience\_level == "intern":
            score = 95
            reason = "Internship role — ideal for freshers"
        elif job.experience\_level == "entry":
            score = 85
            reason = "Entry-level role — good fit for freshers"

        return score, reason

    def \_compute\_logistics(self, user\_locations, user\_mode, job) -> tuple\[float, str]:
        score = 50
        reasons = \[]

        # Work mode match
        if user\_mode == "any" or user\_mode == job.remote\_type:
            score += 25
            reasons.append(f"Work mode matches ({job.remote\_type})")
        elif job.remote\_type == "remote":
            score += 20
            reasons.append("Remote job — flexible location")
        elif job.remote\_type == "unknown":
            reasons.append("Work mode not specified")

        # Location match
        if user\_locations:
            job\_loc\_lower = (job.location or "").lower()
            for pref\_loc in user\_locations:
                if pref\_loc.lower() in job\_loc\_lower:
                    score += 25
                    reasons.append(f"Location matches preference ({pref\_loc})")
                    break
        else:
            score += 10  # No preference = slightly positive

        return min(100, score), "; ".join(reasons) if reasons else "No logistics info"

    def \_compute\_recency(self, posted\_at: Optional\[datetime]) -> float:
        if not posted\_at:
            return 30  # Unknown date = low-ish
        days\_old = (datetime.utcnow() - posted\_at).days
        if days\_old <= 3:
            return 100
        elif days\_old <= 7:
            return 90
        elif days\_old <= 14:
            return 75
        elif days\_old <= 30:
            return 50
        elif days\_old <= 60:
            return 25
        else:
            return 10

    def \_compute\_completeness(self, resume: ParsedResume) -> float:
        """How complete is the user's profile/resume?"""
        checks = \[
            bool(resume.skills),
            bool(resume.education),
            bool(resume.projects),
            bool(resume.embedding is not None),
            len(resume.skills) >= 3,
            bool(resume.extracted\_text and len(resume.extracted\_text) > 200),
        ]
        return (sum(checks) / len(checks)) \* 100

    def \_source\_label(self, source: str) -> str:
        labels = {
            "greenhouse": "Verified company ATS feed (Greenhouse)",
            "lever": "Verified company ATS feed (Lever)",
            "github": "Community-curated list (GitHub)",
            "hn": "Community discussion (Hacker News)",
            "rss": "Engineering blog (RSS)",
            "manual": "Manually curated data",
        }
        return labels.get(source, f"Source: {source}")

    def \_confidence\_level(self, score: float) -> str:
        if score >= 0.85:
            return "High confidence"
        elif score >= 0.60:
            return "Medium confidence"
        else:
            return "Low confidence — treat as approximate"
```

### Explanation JSON Structure

```json
{
  "match\_score": 78.5,
  "factor\_scores": {
    "exact\_skill": 72.0,
    "semantic": 85.3,
    "fresher\_fit": 90.0,
    "role\_relevance": 80.0,
    "logistics": 75.0,
    "recency": 100.0,
    "source\_confidence": 90.0,
    "completeness": 83.3
  },
  "matched\_skills": \["react", "javascript", "typescript", "git", "sql"],
  "missing\_required": \["golang", "kubernetes"],
  "missing\_preferred": \["graphql", "terraform"],
  "fresher\_fit\_reason": "Job mentions 'new grad' — strong fresher fit",
  "logistics\_reason": "Remote job — flexible location; Location matches preference (Bangalore)",
  "source\_label": "Verified company ATS feed (Greenhouse)",
  "confidence\_level": "High confidence",
  "recency\_note": "Posted 2 days ago"
}
```

### Skill Taxonomy \& Normalization

```python
# services/data/skill\_taxonomy.json (excerpt)
SKILL\_SYNONYMS = {
    "javascript": \["js", "ecmascript", "es6", "es2015"],
    "typescript": \["ts"],
    "react": \["reactjs", "react.js", "react js"],
    "node.js": \["nodejs", "node"],
    "python": \["python3", "python2"],
    "postgresql": \["postgres", "psql", "pg"],
    "machine learning": \["ml", "machine-learning"],
    "amazon web services": \["aws"],
    "google cloud platform": \["gcp", "google cloud"],
    "docker": \["containerization"],
    "kubernetes": \["k8s"],
    "data structures": \["dsa", "data structures and algorithms"],
    "ci/cd": \["cicd", "continuous integration", "continuous deployment"],
    # ... 200+ entries
}

def normalize\_skill(skill: str) -> str:
    """Normalize a skill name to its canonical form."""
    skill\_lower = skill.lower().strip()
    for canonical, aliases in SKILL\_SYNONYMS.items():
        if skill\_lower == canonical or skill\_lower in aliases:
            return canonical
    return skill\_lower
```

### Embedding Pipeline

```python
from sentence\_transformers import SentenceTransformer

class EmbeddingService:
    def \_\_init\_\_(self):
        # all-MiniLM-L6-v2: 384 dimensions, fast, good quality
        self.model = SentenceTransformer("all-MiniLM-L6-v2")

    def embed\_text(self, text: str) -> list\[float]:
        """Generate a 384-dim embedding for a text string."""
        embedding = self.model.encode(text, normalize\_embeddings=True)
        return embedding.tolist()

    def embed\_resume(self, resume: ParsedResume) -> list\[float]:
        """Create a composite resume embedding from key sections."""
        sections = \[]
        if resume.skills:
            sections.append("Skills: " + ", ".join(resume.skills))
        if resume.projects:
            sections.append("Projects: " + " | ".join(
                p.get("name", "") + ": " + p.get("description", "")\[:200]
                for p in resume.projects\[:5]
            ))
        if resume.education:
            sections.append("Education: " + " | ".join(
                e.get("degree", "") + " " + e.get("college", "")
                for e in resume.education
            ))
        if resume.extracted\_text:
            sections.append(resume.extracted\_text\[:1000])

        combined = "\\n".join(sections)
        return self.embed\_text(combined)

    def embed\_job(self, job: NormalizedJob) -> list\[float]:
        """Create a composite job embedding from key fields."""
        parts = \[
            f"Title: {job.job\_title}",
            f"Skills: {', '.join(job.skills\_json or \[])}",
        ]
        if job.description:
            parts.append(f"Description: {job.description\[:1500]}")
        if job.responsibilities:
            parts.append(f"Responsibilities: {job.responsibilities\[:500]}")

        combined = "\\n".join(parts)
        return self.embed\_text(combined)
```

\---

## 7\. API Design

### Next.js API Routes (Node.js)

|Method|Endpoint|Description|Auth|
|-|-|-|-|
|`POST`|`/api/auth/register`|Register new user|Public|
|`POST`|`/api/auth/login`|Login, return JWT|Public|
|`POST`|`/api/auth/logout`|Invalidate session|User|
|`GET`|`/api/users/me`|Get current user profile|User|
|`PUT`|`/api/users/me`|Update user profile|User|
|`POST`|`/api/resumes/upload`|Upload resume PDF|User|
|`GET`|`/api/resumes/me`|Get parsed resume data|User|
|`DELETE`|`/api/resumes/me`|Delete resume \& parsed data|User|
|`GET`|`/api/jobs`|List/search jobs (paginated, filtered)|User|
|`GET`|`/api/jobs/:id`|Get job detail|User|
|`GET`|`/api/jobs/recommendations`|Get matched jobs for user|User|
|`POST`|`/api/jobs/:id/save`|Save a job|User|
|`DELETE`|`/api/jobs/:id/save`|Unsave a job|User|
|`GET`|`/api/saved-jobs`|List saved jobs|User|
|`POST`|`/api/applications`|Create application entry|User|
|`GET`|`/api/applications`|List user's applications|User|
|`PATCH`|`/api/applications/:id`|Update application status/notes|User|
|`DELETE`|`/api/applications/:id`|Delete application|User|
|`GET`|`/api/companies/:id`|Get company profile|User|
|`GET`|`/api/companies/:id/interviews`|Get interview questions|User|
|`GET`|`/api/companies/:id/insights`|Get company insights|User|
|`GET`|`/api/skills/gap`|Get skill gap analysis|User|
|`GET`|`/api/notifications`|Get user notifications|User|
|`PATCH`|`/api/notifications/:id/read`|Mark notification read|User|
|`POST`|`/api/privacy/delete-account`|Delete user account + data|User|
|`POST`|`/api/privacy/export`|Export user data|User|

### Admin Routes

|Method|Endpoint|Description|Auth|
|-|-|-|-|
|`GET`|`/api/admin/stats`|Dashboard statistics|Admin|
|`GET`|`/api/admin/sources`|List source feeds|Admin|
|`POST`|`/api/admin/sources`|Add source feed|Admin|
|`PATCH`|`/api/admin/sources/:id`|Update source feed|Admin|
|`DELETE`|`/api/admin/sources/:id`|Deactivate source feed|Admin|
|`POST`|`/api/admin/ingestion/trigger`|Trigger manual ingestion|Admin|
|`GET`|`/api/admin/ingestion/status`|Check ingestion status|Admin|
|`GET`|`/api/admin/companies`|List companies|Admin|
|`POST`|`/api/admin/companies`|Add/edit company manually|Admin|

### Python FastAPI Endpoints (Internal)

|Method|Endpoint|Description|
|-|-|-|
|`POST`|`/parse/resume`|Parse uploaded PDF → structured data|
|`POST`|`/embed/text`|Generate embedding for text|
|`POST`|`/embed/resume`|Generate composite resume embedding|
|`POST`|`/embed/job`|Generate composite job embedding|
|`POST`|`/match/compute`|Compute match score for user×job|
|`POST`|`/match/batch`|Compute matches for user×multiple jobs|
|`GET`|`/match/explain/:match\_id`|Get detailed explanation|
|`POST`|`/summarize`|Summarize raw text (rule-based)|
|`POST`|`/skills/extract`|Extract skills from text|
|`POST`|`/ingestion/trigger`|Trigger ingestion pipeline|
|`GET`|`/ingestion/status`|Get pipeline status|
|`GET`|`/health`|Health check|

### Example Request/Response Shapes

**POST /api/auth/register**

```json
// Request
{
  "name": "Rahul Sharma",
  "email": "rahul@example.com",
  "password": "securePassword123",
  "college": "IIT Delhi",
  "branch": "Computer Science",
  "graduation\_year": 2025
}

// Response 201
{
  "user": { "id": "uuid", "name": "Rahul Sharma", "email": "rahul@example.com" },
  "token": "jwt-token-here"
}
```

**GET /api/jobs/recommendations?page=1\&limit=20**

```json
// Response 200
{
  "jobs": \[
    {
      "id": "job-uuid",
      "job\_title": "Frontend Engineer (New Grad)",
      "company\_name": "Stripe",
      "location": "Bangalore, India",
      "remote\_type": "hybrid",
      "apply\_url": "https://stripe.com/jobs/...",
      "source": "greenhouse",
      "confidence\_score": 0.90,
      "posted\_at": "2026-06-05T10:00:00Z",
      "match": {
        "score": 82.5,
        "matched\_skills": \["react", "typescript", "git"],
        "missing\_skills": \["graphql"],
        "fresher\_fit": "Entry-level role — good fit",
        "confidence\_level": "High confidence",
        "source\_label": "Verified ATS feed"
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 147 }
}
```

**GET /api/skills/gap**

```json
// Response 200
{
  "user\_skills": \["python", "javascript", "react", "sql", "git"],
  "top\_missing\_skills": \[
    { "skill": "docker", "demand\_count": 34, "priority": "high" },
    { "skill": "aws", "demand\_count": 28, "priority": "high" },
    { "skill": "typescript", "demand\_count": 25, "priority": "medium" },
    { "skill": "system design", "demand\_count": 20, "priority": "medium" },
    { "skill": "kubernetes", "demand\_count": 15, "priority": "low" }
  ],
  "skill\_coverage": {
    "matched\_jobs\_percent": 62,
    "average\_match\_score": 71.3
  }
}
```

\---

## 8\. Frontend Page Design

### Page-by-Page Specifications

#### 1\. Landing Page (`/`)

* **Purpose**: Public marketing page, SEO-optimized
* **Key elements**:

  * Hero section with tagline: *"Your AI-Powered Job Search Companion for CS Freshers"*
  * Feature highlights (6 cards): Smart Matching, Skill Gaps, Resume Parsing, Application Tracker, Company Intel, Free \& Open Sourse
  * How-it-works section (4 steps): Sign Up → Upload Resume → Get Matches → Track Applications
  * Stats section (animated counters): Jobs indexed, Companies tracked, Skills mapped
  * CTA buttons: "Get Started Free" / "See How It Works"
  * Footer with links

#### 2\. Auth Pages (`/login`, `/register`)

* **Split-screen layout**: Form on left, illustration on right
* **Register fields**: Name, Email, Password, College, Branch, Graduation Year
* **Login fields**: Email, Password
* **Social auth**: GitHub OAuth button (free via Supabase)
* **Validation**: Zod-based client-side + server-side

#### 3\. Profile Setup (`/dashboard/profile`)

* **Multi-step form** with progress indicator:

  * Step 1: Basic Info (headline, bio, current year)
  * Step 2: Skills (searchable multi-select with taxonomy autocomplete)
  * Step 3: Education (degree, college, branch, CGPA, grad year)
  * Step 4: Preferences (target roles, locations, work mode)
  * Step 5: Links (GitHub, portfolio, LinkedIn)
* **Skill selector**: Typeahead with categories (Languages, Frameworks, Tools, Concepts)

#### 4\. Resume Upload (`/dashboard/resume`)

* **Drag-and-drop zone** for PDF upload
* **Consent checkbox**: "I understand my resume will be parsed..."
* **Processing indicator**: Upload → Extracting text → Parsing sections → Generating embedding
* **Parsed preview**: Expandable sections showing extracted data

  * Skills (editable chips)
  * Education table
  * Projects list
  * Experience timeline
* **Re-upload / Delete** buttons

#### 5\. Job Recommendations Dashboard (`/dashboard`)

* **Primary view** for logged-in users
* **Layout**: Main content + right sidebar
* **Main content**:

  * "Top Matches" section — top 10 jobs sorted by match score
  * Each JobCard shows:

    * Company logo + name
    * Job title
    * Match score (circular progress badge, color-coded)
    * Location + Remote badge
    * Source badge (Greenhouse ✓, GitHub 📋, etc.)
    * Top 3 matched skills as chips
    * "Save" heart icon + "Apply" button
  * Quick-filter chips: Internship / Full-time / Remote / On-site
* **Right sidebar**:

  * Profile completeness meter
  * "Top Missing Skills" panel (top 5 with learn-more links)
  * Recent activity feed

#### 6\. Job Listing + Search (`/dashboard/jobs`)

* **Full search interface** with:

  * Search bar (full-text + semantic)
  * Filter panel (collapsible sidebar):

    * Role type (multi-select)
    * Experience level (intern, entry, junior)
    * Location (searchable)
    * Work mode (remote/onsite/hybrid)
    * Source (Greenhouse, Lever, GitHub)
    * Confidence level (High/Medium/Low)
    * Posted date (Last 7 days, 30 days, All)
    * Salary range (optional, if available)
  * Sort: Best match / Most recent / Highest confidence
* **Results list**: JobCards with pagination (20 per page)
* **Quick stats**: "Showing 147 jobs matching your profile"

#### 7\. Job Detail (`/dashboard/jobs/:id`)

* **Two-column layout**:

  * **Left (65%)**: Full job description

    * Job title, company, location, badges
    * Match score explanation panel (expanded by default)
    * Description (rendered HTML)
    * Responsibilities
    * Qualifications (required vs preferred)
    * Skills required (chips, color-coded: green=matched, red=missing)
  * **Right (35%)**: Action sidebar

    * "Apply Now" button (links to apply\_url)
    * "Save Job" button
    * "Track Application" button → opens modal to add to tracker
    * Source info card (source, confidence, posted date)
    * Company mini-card (link to company page)
    * Similar jobs (3-5 suggestions)
* **Skill Gap section**: Visual comparison of your skills vs required skills

#### 8\. Saved Jobs (`/dashboard/saved`)

* **Grid/List toggle**
* **Saved jobs** with unsave button
* Sort by: Date saved / Match score / Posted date
* Quick action: "Move to Applications"

#### 9\. Application Tracker (`/dashboard/applications`)

* **Kanban board** with 5 columns:

  * To Apply → Applied → Interviewing → Rejected → Offer
* **Drag-and-drop** between columns
* **Each card**:

  * Company + job title
  * Applied date
  * Next follow-up date
  * Notes (expandable)
  * Edit/delete actions
* **Add application** modal (select from saved jobs or search)
* **List view** toggle with sortable table

#### 10\. Company Profile (`/dashboard/companies/:id`)

* **Header**: Company name, logo, industry, size, location, fresher-friendliness badge
* **Tabs**:

  * Overview (culture tags, tech stack, engineering blog highlights)
  * Open Positions (filtered to fresher-relevant)
  * Interview Questions (from interview\_questions table)
  * Community Insights (HN discussions, GitHub mentions)
  * Hiring Notes (process, timeline, tips)
* **Source attribution**: Every piece of data shows source + confidence

#### 11\. Interview Questions (`/dashboard/interviews`)

* **Searchable + filterable**
* **Filters**: Company, Role type, Question type, Difficulty
* **Cards** with:

  * Question text
  * Type badge (Coding / System Design / Behavioral / HR)
  * Difficulty badge
  * Source + confidence
  * Company name (linked)

#### 12\. Skill Gap Analysis (`/dashboard/skills`)

* **Top missing skills** across all matched jobs (bar chart)
* **Skill demand heatmap**: Which skills appear most in your target roles?
* **Your skills vs market**: Side-by-side comparison
* **Per-skill breakdown**: Click a missing skill → see which jobs need it
* **Learning suggestions**: "Consider learning Docker — it appears in 34 of your matched jobs"

#### 13\. Admin Dashboard (`/admin`)

* **Stats overview cards**: Total jobs, Active sources, Users, Last ingestion time
* **Source management table**: Name, Type, URL, Status, Last fetched, Trust level, Actions
* **Ingestion log**: Recent runs with status (success/failure/partial)
* **Manual trigger button**: Run ingestion now
* **Company management**: Add/edit seeded companies

#### 14\. Privacy \& Settings (`/dashboard/settings`)

* **Account info**: Name, email, college (editable)
* **Password change**
* **Resume management**: View/delete parsed data
* **Data export**: Download all your data as JSON
* **Delete account**: Confirmation modal with consequences explained
* **Privacy log**: History of data actions

### Component Library

All UI components will use Tailwind CSS utility classes with a consistent design system:

|Token|Value|
|-|-|
|Primary|`#6366f1` (Indigo-500)|
|Secondary|`#8b5cf6` (Violet-500)|
|Success|`#10b981` (Emerald-500)|
|Warning|`#f59e0b` (Amber-500)|
|Danger|`#ef4444` (Red-500)|
|Background|`#0f172a` (Slate-900, dark mode default)|
|Surface|`#1e293b` (Slate-800)|
|Text Primary|`#f8fafc` (Slate-50)|
|Border Radius|`0.75rem` (rounded-xl)|
|Font|Inter (Google Fonts)|

\---

## 9\. Admin Panel Design

### Admin Features

1. **Dashboard Overview**

   * Total jobs indexed (active/expired/duplicate)
   * Total companies tracked
   * Total registered users
   * Ingestion pipeline health
   * Last run timestamps per source
2. **Source Feed Management**

   * CRUD for `source\_feeds` table
   * Toggle active/inactive per source
   * Set fetch frequency
   * View last fetch status + error logs
3. **Manual Ingestion Trigger**

   * Button to trigger full or per-source ingestion
   * Real-time status indicator
   * Error log viewer
4. **Company Management**

   * Add/edit seeded companies
   * Edit culture tags, interview styles, fresher-friendliness
   * Link engineering blog RSS URLs
5. **Job Management**

   * View all jobs with filters
   * Mark jobs as expired/removed
   * View duplicate groups
   * View raw ingestion payloads
6. **Simple Admin Auth**

   * Separate `admin\_users` table
   * Basic email/password login
   * Role-based: `admin`, `superadmin`, `viewer`

\---

## 10\. Privacy Design

### Privacy Principles

1. **Transparency**: Always tell users what data is collected and why
2. **Consent**: Explicit opt-in for resume parsing
3. **Minimization**: Store only what's needed
4. **Deletion**: Full account deletion including parsed data, embeddings, matches
5. **Auditability**: Log all privacy-relevant actions
6. **No Sharing**: Never share user data externally

### Implementation

```mermaid
flowchart LR
    UPLOAD\["User uploads resume"] --> CONSENT\["Consent checkbox<br/>'I agree to parsing'"]
    CONSENT --> LOG1\["privacy\_logs: consent\_given"]
    LOG1 --> PARSE\["Parse resume"]
    PARSE --> STORE\["Store parsed data<br/>+ embedding"]

    DELETE\_RESUME\["User deletes resume"] --> LOG2\["privacy\_logs: resume\_delete"]
    LOG2 --> CLEAR\["Delete: file, text,<br/>parsed data, embedding"]

    DELETE\_ACCOUNT\["User deletes account"] --> LOG3\["privacy\_logs: account\_delete"]
    LOG3 --> CASCADE\["CASCADE delete:<br/>profile, resume, applications,<br/>saved\_jobs, matches,<br/>notifications"]
```

### Data Deletion Cascade

When a user deletes their account:

1. Delete resume file from storage
2. Delete all rows in: `resumes`, `user\_profiles`, `applications`, `saved\_jobs`, `job\_matches`, `notifications`
3. Anonymize `privacy\_logs` (keep for audit, remove PII)
4. Delete `users` row
5. Log the deletion event

### Consent Flow

```typescript
// ConsentCheckbox component
const ConsentCheckbox = ({ onAccept }) => (
  <div className="consent-panel">
    <h3>Resume Parsing Consent</h3>
    <p>By uploading your resume, you consent to:</p>
    <ul>
      <li>Text extraction from your PDF</li>
      <li>Parsing of skills, education, projects, and experience</li>
      <li>Generation of an embedding vector for job matching</li>
      <li>Storage of parsed data in your private profile</li>
    </ul>
    <p>You can delete your resume and all parsed data at any time.</p>
    <label>
      <input type="checkbox" onChange={onAccept} />
      I understand and consent to resume parsing
    </label>
  </div>
);
```

\---

## 11\. Seed Data Strategy

### Companies to Seed (30-50)

Seed manually with culture tags, interview style, and fresher-friendliness:

|Category|Companies|
|-|-|
|**Big Tech**|Google, Microsoft, Amazon, Meta, Apple|
|**Cloud/Infra**|Cloudflare, Vercel, Netlify, DigitalOcean, MongoDB|
|**Fintech**|Stripe, Razorpay, Zerodha, Cred, PhonePe|
|**Startups (India)**|Swiggy, Zomato, Flipkart, Meesho, Groww, Cred|
|**Dev Tools**|GitHub, GitLab, Atlassian, JetBrains, Figma, Linear, Notion|
|**SaaS**|Salesforce, Freshworks, Zoho, Postman, Hasura|
|**Consulting/Services**|TCS, Infosys, Wipro, Cognizant (fresher-heavy)|
|**Open Source**|Red Hat, Canonical, Mozilla, Automattic|

### Seed Data Files

**`services/data/company\_seeds.json`**:

```json
\[
  {
    "company\_name": "Stripe",
    "domain": "stripe.com",
    "industry": "Fintech",
    "company\_size": "large",
    "headquarters\_location": "San Francisco, CA",
    "culture\_tags": \["remote-friendly", "engineering-driven", "open-source", "documentation-first"],
    "interview\_style": {
      "rounds": 4,
      "types": \["coding", "system-design", "behavioral"],
      "difficulty": "hard",
      "notes": "Known for challenging coding rounds and strong emphasis on code quality"
    },
    "fresher\_friendly": true,
    "engineering\_blogs": \[
      { "url": "https://stripe.com/blog/engineering", "rss": null }
    ],
    "greenhouse\_board": "stripe",
    "lever\_slug": null
  }
]
```

**`services/data/skill\_taxonomy.json`**: \~300 skills with categories and synonyms

**`services/data/interview\_seeds.json`**: 200+ curated interview questions across companies

### Source Feed Seeds

```sql
-- Greenhouse feeds
INSERT INTO source\_feeds (source\_name, source\_type, source\_url, trust\_level, fetch\_frequency) VALUES
('Stripe (Greenhouse)', 'greenhouse', 'https://boards-api.greenhouse.io/v1/boards/stripe/jobs', 'high', 'daily'),
('Cloudflare (Greenhouse)', 'greenhouse', 'https://boards-api.greenhouse.io/v1/boards/cloudflare/jobs', 'high', 'daily'),
('Figma (Greenhouse)', 'greenhouse', 'https://boards-api.greenhouse.io/v1/boards/figma/jobs', 'high', 'daily');

-- Lever feeds
INSERT INTO source\_feeds (source\_name, source\_type, source\_url, trust\_level, fetch\_frequency) VALUES
('Netflix (Lever)', 'lever', 'https://api.lever.co/v0/postings/netflix', 'high', 'daily');

-- GitHub curated lists
INSERT INTO source\_feeds (source\_name, source\_type, source\_url, trust\_level, fetch\_frequency) VALUES
('New Grad Positions', 'github', 'https://api.github.com/repos/SimplifyJobs/New-Grad-Positions/contents/README.md', 'medium', 'daily'),
('Summer Internships', 'github', 'https://api.github.com/repos/SimplifyJobs/Summer2025-Internships/contents/README.md', 'medium', 'daily');
```

\---

## 12\. Deployment Plan

### Free-Tier Deployment Stack

|Component|Service|Free Tier|
|-|-|-|
|**Next.js Frontend + API**|Vercel|Hobby plan (free)|
|**Python FastAPI**|Railway / Render|500 hrs/month (Railway) or 750 hrs/month (Render)|
|**PostgreSQL + pgvector**|Supabase|500 MB, 2 projects free|
|**File Storage**|Supabase Storage|1 GB free|
|**Auth**|Supabase Auth|50,000 MAU free|
|**Domain**|Vercel (auto `.vercel.app`)|Free subdomain|

### Alternative: Fully Self-Hosted (Docker Compose)

```yaml
# docker-compose.yml
version: '3.8'

services:
  web:
    build: ./web
    ports: \["3000:3000"]
    environment:
      DATABASE\_URL: postgresql://user:pass@db:5432/jobintel
      PYTHON\_SERVICE\_URL: http://api:8000
      NEXTAUTH\_SECRET: ${NEXTAUTH\_SECRET}
    depends\_on: \[db, api]

  api:
    build: ./services
    ports: \["8000:8000"]
    environment:
      DATABASE\_URL: postgresql://user:pass@db:5432/jobintel
      EMBEDDING\_MODEL: all-MiniLM-L6-v2
    volumes:
      - model\_cache:/root/.cache/huggingface
      - uploads:/app/uploads
    depends\_on: \[db]

  db:
    image: pgvector/pgvector:pg16
    ports: \["5432:5432"]
    environment:
      POSTGRES\_USER: user
      POSTGRES\_PASSWORD: pass
      POSTGRES\_DB: jobintel
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

volumes:
  pgdata:
  model\_cache:
  uploads:
```

### Environment Variables

```env
# .env.example
# Database
DATABASE\_URL=postgresql://user:pass@localhost:5432/jobintel

# Auth
NEXTAUTH\_SECRET=your-secret-here
SUPABASE\_URL=https://xxx.supabase.co
SUPABASE\_ANON\_KEY=your-anon-key

# Python Service
PYTHON\_SERVICE\_URL=http://localhost:8000
PYTHON\_API\_KEY=internal-api-key

# GitHub (optional, for higher rate limits)
GITHUB\_TOKEN=ghp\_xxx

# File Storage
UPLOAD\_DIR=./uploads
MAX\_FILE\_SIZE\_MB=5

# Embedding
EMBEDDING\_MODEL=all-MiniLM-L6-v2
EMBEDDING\_CACHE\_DIR=./model\_cache
```

\---

## 13\. Demo Flow

### 5-Minute Demo Script

> \[!TIP]
> Prepare this flow in advance with seeded data for a smooth presentation.

**Step 1: Landing Page (30 sec)**

* Show the polished landing page
* Highlight features and "How It Works"

**Step 2: Registration (30 sec)**

* Register as "Priya Sharma, IIT Delhi, CS, 2025"
* Quick profile setup: React, JavaScript, Python, SQL, Git

**Step 3: Resume Upload (45 sec)**

* Upload sample resume PDF
* Show consent flow
* Watch real-time parsing: skills extracted, education parsed, projects listed
* Show the generated embedding status

**Step 4: Job Recommendations (90 sec)**

* Navigate to dashboard
* Show top 10 matched jobs with scores (82%, 78%, 75%...)
* Click into a high-match job (e.g., "Frontend Engineer New Grad at Stripe")
* Walk through the explanation panel:

  * ✅ Matches: React, JavaScript, Git
  * ❌ Missing: TypeScript (preferred)
  * 🎓 Fresher Fit: "New Grad role — ideal"
  * 📍 Location: "Remote — matches preference"
  * 🔗 Source: "Greenhouse ATS — High confidence"
  * 📅 Recency: "Posted 3 days ago"

**Step 5: Skill Gap (30 sec)**

* Show skill gap analysis page
* Highlight: "Docker appears in 34 matched jobs — consider learning it"

**Step 6: Company Profile (30 sec)**

* Navigate to Stripe's company page
* Show: culture tags, interview questions, HN insights, engineering blog summary

**Step 7: Application Tracker (30 sec)**

* Save a job → move to "Applied" column
* Show Kanban board with drag-and-drop

**Step 8: Admin Panel (15 sec)**

* Quick look at admin: source feeds, ingestion status, job counts

\---

## 14\. Final Report Content

### Suggested Report Outline

```
1. Introduction
   1.1 Problem Statement
   1.2 Motivation
   1.3 Objectives
   1.4 Scope and Limitations

2. Literature Review
   2.1 Existing Job Platforms and Their Limitations
   2.2 Resume Parsing Techniques
   2.3 Text Embeddings and Semantic Search
   2.4 Hybrid Recommendation Systems
   2.5 Explainable AI in Recommendations

3. System Design
   3.1 Architecture Overview
   3.2 Technology Stack Justification
   3.3 Database Design (ER Diagram, Schema)
   3.4 API Design
   3.5 Data Ingestion Pipeline
   3.6 Matching Algorithm Design

4. Implementation
   4.1 Frontend Implementation (Next.js + Tailwind)
   4.2 Backend API Implementation
   4.3 Python Microservice (FastAPI)
   4.4 Resume Parser
   4.5 Embedding Pipeline
   4.6 Hybrid Matching Engine
   4.7 Data Ingestion Workers
   4.8 Admin Panel

5. Testing
   5.1 Unit Tests (Resume Parser, Matching, Normalization)
   5.2 Integration Tests (API Endpoints)
   5.3 End-to-End Tests
   5.4 Performance Testing (Search, Matching)
   5.5 Test Results Summary

6. Results and Evaluation
   6.1 Demo Walkthrough
   6.2 Matching Quality Analysis
   6.3 User Feedback (if any)
   6.4 Performance Metrics
   6.5 Screenshots

7. Privacy and Ethics
   7.1 Data Collection Practices
   7.2 Consent Mechanisms
   7.3 Ethical Considerations
   7.4 Limitations of Automated Matching

8. Future Scope
   8.1 Additional Data Sources
   8.2 Advanced NLP Models
   8.3 User Feedback Loop
   8.4 Mobile App
   8.5 Real-Time Notifications

9. Conclusion

10. References

11. Appendices
    A. Full Database Schema
    B. API Reference
    C. Skill Taxonomy
    D. Sample Data
    E. Deployment Guide
```

\---

## 15\. Future Scope

|Feature|Description|Complexity|
|-|-|-|
|**Feedback Loop**|Let users rate match quality → retrain weights|Medium|
|**Browser Extension**|Detect job pages and auto-save/match|High|
|**Mobile App**|React Native companion app|High|
|**More Data Sources**|AngelList, Y Combinator jobs, Indeed RSS|Medium|
|**Advanced NLP**|Fine-tuned models for skill extraction|High|
|**Collaborative Filtering**|"Users like you also applied to..."|Medium|
|**Real-Time Alerts**|Push notifications for new high-match jobs|Medium|
|**Resume Builder**|In-app resume creation tool|Medium|
|**Mock Interview AI**|Practice with AI-generated questions|High|
|**Peer Networking**|Connect freshers applying to same companies|Medium|
|**Analytics Dashboard**|User-facing analytics (application success rates)|Low|
|**Multi-Language**|Support Hindi and regional languages|Medium|

\---

## 16\. Implementation Phases \& Timeline

### Recommended: 14-Week Plan (3-4 Person Team)

```mermaid
gantt
    title Implementation Timeline (14 Weeks)
    dateFormat  YYYY-MM-DD
    axisFormat  %b %d

    section Phase 1: Foundation
    Project setup \& tooling         :p1a, 2026-06-09, 3d
    Database schema + migrations    :p1b, after p1a, 3d
    Auth system (Supabase/JWT)      :p1c, after p1a, 4d
    Basic API routes (CRUD)         :p1d, after p1b, 5d

    section Phase 2: Core Backend
    Resume parser (PyMuPDF)         :p2a, after p1d, 5d
    Skill extraction + taxonomy     :p2b, after p2a, 4d
    Embedding service               :p2c, after p2b, 3d
    Matching engine (hybrid scorer) :p2d, after p2c, 7d

    section Phase 3: Data Ingestion
    Greenhouse fetcher              :p3a, after p1d, 3d
    Lever fetcher                   :p3b, after p3a, 2d
    GitHub fetcher                  :p3c, after p3b, 3d
    HN + RSS fetchers               :p3d, after p3c, 3d
    Normalizer + deduplicator       :p3e, after p3d, 4d
    Scheduler + pipeline            :p3f, after p3e, 3d

    section Phase 4: Frontend
    Landing + Auth pages            :p4a, after p1c, 5d
    Dashboard shell + layout        :p4b, after p4a, 3d
    Profile + Resume pages          :p4c, after p4b, 5d
    Job listing + detail pages      :p4d, after p2d, 7d
    Match explanation UI            :p4e, after p4d, 4d
    Application tracker (Kanban)    :p4f, after p4e, 5d
    Company + Interview pages       :p4g, after p4f, 5d
    Skill gap page                  :p4h, after p4g, 3d

    section Phase 5: Polish
    Admin dashboard                 :p5a, after p4h, 4d
    Privacy \& settings              :p5b, after p5a, 3d
    Seed data loading               :p5c, after p5b, 2d
    Responsive design + animations  :p5d, after p5c, 4d
    Testing + bug fixes             :p5e, after p5d, 5d

    section Phase 6: Delivery
    Deployment                      :p6a, after p5e, 2d
    Documentation + report          :p6b, after p6a, 5d
    Demo preparation                :p6c, after p6b, 2d
```

### Team Role Allocation (4-Person Team)

|Role|Person|Primary Responsibilities|
|-|-|-|
|**Frontend Lead**|Person A|Next.js pages, Tailwind UI, components, Kanban board|
|**Backend Lead**|Person B|API routes, Prisma, auth, saved jobs, applications|
|**ML/Data Lead**|Person C|FastAPI service, resume parser, embeddings, matching engine|
|**Data Engineer**|Person D|Ingestion pipeline, fetchers, normalizer, dedup, scheduler|

> \[!IMPORTANT]
> All team members should contribute to testing, documentation, and the final report.

\---

## Open Questions

> \[!IMPORTANT]
> \*\*Auth Strategy\*\*: Should we use \*\*Supabase Auth\*\* (fastest to implement, free tier, includes GitHub OAuth) or \*\*custom JWT auth with bcrypt\*\* (more control, no external dependency)? Supabase Auth is recommended for speed.

> \[!IMPORTANT]
> \*\*Deployment Target\*\*: Should we deploy to \*\*Vercel + Supabase\*\* (easiest, free) or provide a \*\*Docker Compose\*\* setup for self-hosted demo? We can support both — Vercel for live demo, Docker for local development.

> \[!NOTE]
> \*\*Embedding Model Loading\*\*: The `all-MiniLM-L6-v2` model is \~80MB. On first run, it downloads from HuggingFace. For the demo, we should pre-cache the model in the Docker image or have it ready on the deployment server.

> \[!NOTE]
> \*\*GitHub API Rate Limits\*\*: Without a token, GitHub allows only 60 requests/hour. A free personal access token gives 5,000/hour. We should document this and make the token optional but recommended.

\---

## Verification Plan

### Automated Tests

```bash
# Python service tests
cd services \&\& pytest tests/ -v --cov=app

# Next.js API tests
cd web \&\& npm run test

# E2E tests (optional, with Playwright)
cd web \&\& npx playwright test
```

### Key Test Cases

|Area|Test|Type|
|-|-|-|
|Resume Parser|Parse sample PDF → verify skills extracted|Unit|
|Skill Normalizer|"ReactJS" → "react", "JS" → "javascript"|Unit|
|Matching Engine|Known user+job → expected score range|Unit|
|Greenhouse Fetcher|Mock API → normalized jobs|Integration|
|Deduplicator|Same job twice → marked as duplicate|Unit|
|API /jobs|Pagination, filters, auth|Integration|
|API /recommendations|Returns sorted by match score|Integration|
|Kanban|Drag application between columns|E2E|
|Account Deletion|All user data removed|Integration|

### Manual Verification

* \[ ] Upload 3 different resume formats and verify parsing
* \[ ] Verify match explanations make logical sense for 10 jobs
* \[ ] Check that all external API calls respect rate limits
* \[ ] Confirm account deletion removes all user data
* \[ ] Test mobile responsiveness on phone/tablet viewports
* \[ ] Verify admin can trigger ingestion and see results

