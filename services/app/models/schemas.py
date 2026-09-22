from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    timestamp: datetime

class ResumeParseResponse(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    skills: List[str] = []
    target_roles: List[str] = []
    education: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    experience: List[Dict[str, Any]] = []
    certifications: List[str] = []
    achievements: List[str] = []
    extracted_text: str

class EmbeddingRequest(BaseModel):
    text: str

class EmbeddingResponse(BaseModel):
    embedding: List[float]

class MatchRequest(BaseModel):
    user_skills: List[str] = []
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    preferred_work_mode: str = "any"
    resume_skills: List[str] = []
    resume_embedding: Optional[List[float]] = None
    resume_completeness_score: float = 100.0
    job_id: str = ""
    job_title: str
    company_name: str = ""
    job_required_skills: List[str] = []
    job_preferred_skills: List[str] = []
    job_description: str = ""
    job_location: str = "Unknown"
    job_remote_type: str = "unknown"
    job_experience_level: str = "entry"
    job_source: str = "direct"
    job_confidence_score: float = 0.8
    job_posted_at: Optional[datetime] = None
    job_embedding: Optional[List[float]] = None

class FactorScores(BaseModel):
    exact_skill: float
    semantic: float
    fresher_fit: float
    role_relevance: float
    logistics: float
    recency: float
    source_confidence: float
    completeness: float

class MatchExplanation(BaseModel):
    matched_skills: List[str]
    missing_required: List[str]
    missing_preferred: List[str]
    fresher_fit_reason: str
    logistics_reason: str
    source_label: str
    confidence_level: str
    recency_note: str

class MatchResponse(BaseModel):
    match_score: float
    factor_scores: FactorScores
    explanation: MatchExplanation

class IngestionTriggerRequest(BaseModel):
    source_feed_id: Optional[str] = None

class IngestionStatusResponse(BaseModel):
    status: str
    jobs_processed: int
    duplicates_found: int
    errors: List[str]

class SummarizeRequest(BaseModel):
    text: str
    max_sentences: int = 5

class SummarizeResponse(BaseModel):
    summary: str

class SkillExtractionRequest(BaseModel):
    text: str

class SkillExtractionResponse(BaseModel):
    skills: List[str]
