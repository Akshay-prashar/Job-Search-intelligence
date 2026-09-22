-- B-tree indexes for common lookups and FK constraints
CREATE INDEX idx_users_resume_id ON users(resume_id);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_jobs_company ON jobs(company_id);
CREATE INDEX idx_jobs_status ON jobs(job_status);
CREATE INDEX idx_jobs_source ON jobs(source);
CREATE INDEX idx_jobs_experience ON jobs(experience_level);
CREATE INDEX idx_jobs_posted ON jobs(posted_at DESC);
CREATE INDEX idx_jobs_content_hash ON jobs(content_hash);

CREATE INDEX idx_jobreq_job ON job_requirements(job_id);
CREATE INDEX idx_applications_user ON applications(user_id);
CREATE INDEX idx_applications_job ON applications(job_id);
CREATE INDEX idx_saved_user ON saved_jobs(user_id);
CREATE INDEX idx_saved_job ON saved_jobs(job_id);
CREATE INDEX idx_matches_user_score ON job_matches(user_id, match_score DESC);
CREATE INDEX idx_matches_job ON job_matches(job_id);

CREATE INDEX idx_insights_company ON company_insights(company_id);
CREATE INDEX idx_iq_company ON interview_questions(company_id);
CREATE INDEX idx_hn_company ON hiring_notes(company_id);
CREATE INDEX idx_raw_source ON raw_ingestions(source_feed_id);
CREATE INDEX idx_raw_status ON raw_ingestions(processing_status);
CREATE INDEX idx_raw_hash ON raw_ingestions(content_hash);
CREATE INDEX idx_notif_user ON notifications(user_id, read_status);
CREATE INDEX idx_privacy_user ON privacy_logs(user_id);

-- pgvector indexes (IVFFlat is great for faster cosine similarity)
-- Adjust lists based on expected count (100 lists is a standard starting point for thousands of rows)
CREATE INDEX idx_jobs_embedding ON jobs
    USING ivfflat (embeddings_vector vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX idx_resumes_embedding ON resumes
    USING ivfflat (embeddings_vector vector_cosine_ops)
    WITH (lists = 50);

-- GIN index for JSONB queries
CREATE INDEX idx_jobs_skills_json ON jobs USING gin (skills_json);
CREATE INDEX idx_user_profiles_skills_json ON user_profiles USING gin (skills_json);
