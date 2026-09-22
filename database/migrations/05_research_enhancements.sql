-- Migration 05: Research-Enhanced Taxonomy & Two-Stage Matching
-- Enables taxonomy linking (ESCO baseline) and selective LLM reranking storage

-- 1. Add research columns to job_matches if they do not exist
ALTER TABLE job_matches
    ADD COLUMN IF NOT EXISTS taxonomy_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS rerank_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS final_score DECIMAL(5,2),
    ADD COLUMN IF NOT EXISTS taxonomy_evidence_json JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS rerank_explanation_json JSONB DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS rerank_model VARCHAR(100);

-- Update index for user score ranking with final_score priority
DROP INDEX IF EXISTS idx_matches_user_score;
CREATE INDEX IF NOT EXISTS idx_matches_user_score 
    ON job_matches(user_id, final_score DESC NULLS LAST, match_score DESC);

-- 2. Create taxonomy_terms table
CREATE TABLE IF NOT EXISTS taxonomy_terms (
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

-- 3. Create job_taxonomy_links table
CREATE TABLE IF NOT EXISTS job_taxonomy_links (
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

-- 4. Create resume_taxonomy_links table
CREATE TABLE IF NOT EXISTS resume_taxonomy_links (
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
