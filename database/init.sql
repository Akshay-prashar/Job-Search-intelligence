CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- 1. users
-- ============================================================
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name                VARCHAR(255) NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    password_hash       VARCHAR(255),           -- NULL if using OAuth/Supabase Auth
    auth_provider_id    VARCHAR(255),           -- External auth provider user ID
    college             VARCHAR(255),
    branch              VARCHAR(100),
    graduation_year     INTEGER,
    cgpa                DECIMAL(4,2),
    target_roles        JSONB DEFAULT '[]',     -- e.g. ["frontend", "backend", "fullstack"]
    preferred_locations JSONB DEFAULT '[]',     -- e.g. ["Bangalore", "Remote"]
    preferred_work_mode VARCHAR(20) DEFAULT 'any'
                        CHECK (preferred_work_mode IN ('remote','onsite','hybrid','any')),
    resume_id           UUID,                   -- FK added after resumes table
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. user_profiles
-- ============================================================
CREATE TABLE user_profiles (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    headline          VARCHAR(255),
    bio               TEXT,
    github_url        VARCHAR(512),
    linkedin_url      VARCHAR(512),
    portfolio_url     VARCHAR(512),
    current_year      VARCHAR(20),              -- e.g. "4th year", "graduated"
    skills_json       JSONB DEFAULT '[]',       -- [{name, level, category}]
    achievements_json JSONB DEFAULT '[]',       -- [{title, description, date}]
    preferences_json  JSONB DEFAULT '{}',       -- misc user preferences
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ============================================================
-- 3. resumes
-- ============================================================
CREATE TABLE resumes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    file_name         VARCHAR(255) NOT NULL,
    file_url          VARCHAR(1024),
    mime_type         VARCHAR(50) DEFAULT 'application/pdf',
    extracted_text    TEXT,
    parsed_sections   JSONB DEFAULT '{}',       -- {summary, experience, education, ...}
    skills_json       JSONB DEFAULT '[]',       -- extracted skills
    education_json    JSONB DEFAULT '[]',       -- [{degree, college, year, cgpa}]
    projects_json     JSONB DEFAULT '[]',       -- [{name, description, tech, url}]
    embeddings_vector VECTOR(384),              -- all-MiniLM-L6-v2 = 384 dims
    upload_status     VARCHAR(20) DEFAULT 'pending'
                      CHECK (upload_status IN ('pending','processing','completed','failed')),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK from users.resume_id -> resumes.id
ALTER TABLE users
    ADD CONSTRAINT fk_users_resume
    FOREIGN KEY (resume_id) REFERENCES resumes(id) ON DELETE SET NULL;

-- ============================================================
-- 4. companies
-- ============================================================
CREATE TABLE companies (
    id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name           VARCHAR(255) NOT NULL,
    domain                 VARCHAR(255),          -- e.g. "stripe.com"
    logo_url               VARCHAR(1024),
    industry               VARCHAR(100),
    company_size           VARCHAR(50),            -- e.g. "startup", "mid", "large", "enterprise"
    headquarters_location  VARCHAR(255),
    source_type            VARCHAR(50),            -- "manual", "greenhouse", "lever", "github"
    culture_tags_json      JSONB DEFAULT '[]',     -- ["remote-first", "open-source", "fast-paced"]
    interview_style_json   JSONB DEFAULT '{}',     -- {rounds, types, difficulty}
    engineering_blogs_json JSONB DEFAULT '[]',     -- [{url, title, last_fetched}]
    fresher_friendly       BOOLEAN DEFAULT FALSE,
    public_hiring_email    VARCHAR(255),           -- Only if publicly available
    created_at             TIMESTAMPTZ DEFAULT NOW(),
    updated_at             TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT companies_domain_key UNIQUE (domain)
);

CREATE UNIQUE INDEX idx_companies_domain ON companies(domain) WHERE domain IS NOT NULL;

-- ============================================================
-- 5. jobs
-- ============================================================
CREATE TABLE jobs (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id              UUID REFERENCES companies(id) ON DELETE SET NULL,
    external_job_id         VARCHAR(255),
    job_title               VARCHAR(500) NOT NULL,
    role_type               VARCHAR(50),           -- "frontend", "backend", "fullstack", "devops", "data", "ml", "mobile"
    location                VARCHAR(255),
    remote_type             VARCHAR(20) DEFAULT 'unknown'
                            CHECK (remote_type IN ('remote','onsite','hybrid','unknown')),
    experience_level        VARCHAR(30) DEFAULT 'entry'
                            CHECK (experience_level IN ('intern','entry','junior','mid','senior','unknown')),
    job_type                VARCHAR(30),           -- "full-time", "internship", "contract", "part-time"
    department              VARCHAR(255),
    description             TEXT,
    responsibilities        TEXT,
    minimum_qualifications  TEXT,
    preferred_qualifications TEXT,
    skills_json             JSONB DEFAULT '[]',    -- normalized skill list
    salary_range            VARCHAR(100),          -- "₹4-6 LPA" or "$60k-$80k"
    apply_url               VARCHAR(1024),
    source                  VARCHAR(50) NOT NULL,  -- "greenhouse", "lever", "github", "manual"
    source_url              VARCHAR(1024),
    posted_at               TIMESTAMPTZ,
    expiry_date             TIMESTAMPTZ,
    confidence_score        DECIMAL(3,2) DEFAULT 0.50,  -- 0.00-1.00
    embeddings_vector       VECTOR(384),
    content_hash            VARCHAR(64),           -- SHA-256 for dedup
    duplicate_of_job_id     UUID REFERENCES jobs(id) ON DELETE SET NULL,
    job_status              VARCHAR(20) DEFAULT 'active'
                            CHECK (job_status IN ('active','expired','duplicate','removed')),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. job_requirements
-- ============================================================
CREATE TABLE job_requirements (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    skill_name       VARCHAR(100) NOT NULL,
    requirement_type VARCHAR(20) DEFAULT 'required'
                     CHECK (requirement_type IN ('required','preferred','nice-to-have')),
    importance_level INTEGER DEFAULT 3 CHECK (importance_level BETWEEN 1 AND 5),
    is_mandatory     BOOLEAN DEFAULT FALSE,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. applications
-- ============================================================
CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id          UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    status          VARCHAR(30) DEFAULT 'to_apply'
                    CHECK (status IN ('to_apply','applied','interviewing','rejected','offer','withdrawn')),
    applied_at      TIMESTAMPTZ,
    follow_up_date  DATE,
    notes           TEXT,
    interview_stage VARCHAR(100),
    result          VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- ============================================================
-- 8. saved_jobs
-- ============================================================
CREATE TABLE saved_jobs (
    id        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id    UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

-- ============================================================
-- 9. job_matches
-- ============================================================
CREATE TABLE job_matches (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id                 UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    job_id                  UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    match_score             DECIMAL(5,2) NOT NULL,   -- original 8-factor score
    exact_match_score       DECIMAL(5,2),
    semantic_score          DECIMAL(5,2),
    fresher_fit_score       DECIMAL(5,2),
    logistics_score         DECIMAL(5,2),
    source_confidence_score DECIMAL(5,2),
    recency_score           DECIMAL(5,2),
    completeness_score      DECIMAL(5,2),
    role_relevance_score    DECIMAL(5,2),
    taxonomy_score          DECIMAL(5,2),
    rerank_score            DECIMAL(5,2),
    final_score             DECIMAL(5,2),
    taxonomy_evidence_json  JSONB DEFAULT '{}',
    rerank_explanation_json JSONB DEFAULT '{}',
    rerank_model            VARCHAR(100),
    explanation_json        JSONB DEFAULT '{}',
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, job_id)
);

CREATE INDEX IF NOT EXISTS idx_matches_user_score 
    ON job_matches(user_id, final_score DESC NULLS LAST, match_score DESC);

-- ============================================================
-- 10. taxonomy_terms
-- ============================================================
CREATE TABLE taxonomy_terms (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    taxonomy_name     VARCHAR(50) NOT NULL,
    external_id       VARCHAR(255) NOT NULL,
    term_type         VARCHAR(30) NOT NULL,
    preferred_label   VARCHAR(255) NOT NULL,
    description       TEXT,
    aliases_json      JSONB DEFAULT '[]',
    embedding_vector  VECTOR(384),
    version_label     VARCHAR(100),
    created_at        TIMESTAMPTZ DEFAULT NOW(),
    updated_at        TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(taxonomy_name, external_id)
);

CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_type ON taxonomy_terms(term_type);
CREATE INDEX IF NOT EXISTS idx_taxonomy_terms_label ON taxonomy_terms(preferred_label);

-- ============================================================
-- 11. job_taxonomy_links
-- ============================================================
CREATE TABLE job_taxonomy_links (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_id           UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    taxonomy_term_id UUID NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
    link_type        VARCHAR(30) NOT NULL,
    confidence_score DECIMAL(5,4) DEFAULT 0.50,
    source_method    VARCHAR(50) NOT NULL,
    evidence_text    TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(job_id, taxonomy_term_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_job_taxonomy_job ON job_taxonomy_links(job_id);
CREATE INDEX IF NOT EXISTS idx_job_taxonomy_term ON job_taxonomy_links(taxonomy_term_id);

-- ============================================================
-- 12. resume_taxonomy_links
-- ============================================================
CREATE TABLE resume_taxonomy_links (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    resume_id        UUID NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    taxonomy_term_id UUID NOT NULL REFERENCES taxonomy_terms(id) ON DELETE CASCADE,
    link_type        VARCHAR(30) NOT NULL,
    confidence_score DECIMAL(5,4) DEFAULT 0.50,
    source_method    VARCHAR(50) NOT NULL,
    evidence_text    TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(resume_id, taxonomy_term_id, link_type)
);

CREATE INDEX IF NOT EXISTS idx_resume_taxonomy_resume ON resume_taxonomy_links(resume_id);
CREATE INDEX IF NOT EXISTS idx_resume_taxonomy_term ON resume_taxonomy_links(taxonomy_term_id);

-- ============================================================
-- 13. company_insights
-- ============================================================
CREATE TABLE company_insights (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    source           VARCHAR(50) NOT NULL,     -- "hn", "github", "rss", "manual"
    insight_type     VARCHAR(50) NOT NULL,     -- "culture", "interview", "engineering", "hiring"
    raw_text         TEXT,
    summarized_text  TEXT,
    tags_json        JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2) DEFAULT 0.50,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 11. interview_questions
-- ============================================================
CREATE TABLE interview_questions (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id       UUID REFERENCES companies(id) ON DELETE CASCADE,
    role_type        VARCHAR(50),
    question_text    TEXT NOT NULL,
    question_type    VARCHAR(30),              -- "coding", "system-design", "behavioral", "hr"
    difficulty_level VARCHAR(20),              -- "easy", "medium", "hard"
    source           VARCHAR(50),
    source_url       VARCHAR(1024),
    confidence_score DECIMAL(3,2) DEFAULT 0.50,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. hiring_notes
-- ============================================================
CREATE TABLE hiring_notes (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_id       UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    note_type        VARCHAR(50),              -- "process", "timeline", "tip", "warning"
    note_text        TEXT NOT NULL,
    source           VARCHAR(50),
    source_url       VARCHAR(1024),
    confidence_score DECIMAL(3,2) DEFAULT 0.50,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. source_feeds
-- ============================================================
CREATE TABLE source_feeds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_name     VARCHAR(100) NOT NULL,
    source_type     VARCHAR(50) NOT NULL,      -- "greenhouse", "lever", "github", "hn", "rss", "manual"
    source_url      VARCHAR(1024) NOT NULL,
    active          BOOLEAN DEFAULT TRUE,
    last_fetched_at TIMESTAMPTZ,
    fetch_frequency VARCHAR(50) DEFAULT 'daily',  -- "hourly", "daily", "weekly"
    rate_limit_notes TEXT,
    trust_level     VARCHAR(20) DEFAULT 'medium'
                    CHECK (trust_level IN ('high','medium','low')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. raw_ingestions
-- ============================================================
CREATE TABLE raw_ingestions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_feed_id    UUID NOT NULL REFERENCES source_feeds(id) ON DELETE CASCADE,
    external_id       VARCHAR(255),
    raw_payload       JSONB,
    raw_text          TEXT,
    content_hash      VARCHAR(64),
    fetched_at        TIMESTAMPTZ DEFAULT NOW(),
    processed_at      TIMESTAMPTZ,
    processing_status VARCHAR(20) DEFAULT 'pending'
                      CHECK (processing_status IN ('pending','processing','completed','failed','skipped')),
    error_message     TEXT
);

-- ============================================================
-- 15. duplicate_groups
-- ============================================================
CREATE TABLE duplicate_groups (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    canonical_job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    duplicate_count  INTEGER DEFAULT 0,
    duplicate_reason VARCHAR(100),             -- "content_hash", "title_company_match", "url_match"
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. notifications
-- ============================================================
CREATE TABLE notifications (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50),             -- "new_match", "stale_job", "application_update"
    title             VARCHAR(255),
    message           TEXT,
    read_status       BOOLEAN DEFAULT FALSE,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. admin_users
-- ============================================================
CREATE TABLE admin_users (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name       VARCHAR(255) NOT NULL,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role       VARCHAR(20) DEFAULT 'admin'
               CHECK (role IN ('admin','superadmin','viewer')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 18. privacy_logs
-- ============================================================
CREATE TABLE privacy_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL,         -- "resume_upload", "resume_delete", "account_delete",
                                              -- "data_export", "consent_given", "consent_revoked"
    details     JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
