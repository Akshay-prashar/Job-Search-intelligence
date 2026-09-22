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

class CompositeResumeEmbeddingRequest(BaseModel):
    summary: str = ""
    skills: List[str] = []
    experience: List[Dict[str, Any]] = []
    projects: List[Dict[str, Any]] = []
    education: List[Dict[str, Any]] = []

class CompositeJobEmbeddingRequest(BaseModel):
    title: str = ""
    description: str = ""
    required_skills: List[str] = []
    preferred_skills: List[str] = []

class MatchRequest(BaseModel):
    user_skills: List[str] = []
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    preferred_work_mode: str = "any"
    resume_skills: List[str] = []
    resume_summary: str = ""
    resume_text: str = ""
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
    execute_rerank: bool = True

class FactorScores(BaseModel):
    exact_skill: float
    semantic: float
    fresher_fit: float
    role_relevance: float
    logistics: float
    recency: float
    source_confidence: float
    completeness: float

class StrengthItem(BaseModel):
    claim: str
    evidence: Optional[str] = None
    verified: Optional[bool] = None

class GapItem(BaseModel):
    claim: str
    evidence: Optional[str] = None
    verified: Optional[bool] = None

class MatchExplanation(BaseModel):
    base_score: Optional[float] = None
    taxonomy_score: Optional[float] = None
    rerank_score: Optional[float] = None
    final_score: Optional[float] = None
    matched_skills: List[str] = []
    taxonomy_matches: List[str] = []
    missing_required: List[str] = []
    missing_preferred: List[str] = []
    strengths: List[Dict[str, Any]] = []
    gaps: List[Dict[str, Any]] = []
    why_ranked_here: str = ""
    fresher_fit_reason: str = ""
    logistics_reason: str = ""
    source_label: str = ""
    confidence_level: str = ""
    recency_note: str = ""
    reranker_model: str = "unknown"
    fallback_used: bool = True

class MatchResponse(BaseModel):
    match_score: float
    taxonomy_score: float = 0.0
    enhanced_retrieval_score: float = 0.0
    rerank_score: float = 0.0
    final_score: float = 0.0
    factor_scores: FactorScores
    explanation: MatchExplanation

class BatchMatchRequest(BaseModel):
    user_skills: List[str] = []
    target_roles: List[str] = []
    preferred_locations: List[str] = []
    preferred_work_mode: str = "any"
    resume_skills: List[str] = []
    resume_summary: str = ""
    resume_text: str = ""
    resume_embedding: Optional[List[float]] = None
    jobs: List[Dict[str, Any]] = []
    top_k: int = 10

class BatchMatchResponse(BaseModel):
    results: List[Dict[str, Any]]

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

class TaxonomyExtractRequest(BaseModel):
    text: str

class TaxonomyExtractResponse(BaseModel):
    extracted_terms: List[Dict[str, Any]]

class TaxonomyLinkRequest(BaseModel):
    terms: List[str]

class TaxonomyLinkResponse(BaseModel):
    linked_nodes: List[Dict[str, Any]]

class RerankRequest(BaseModel):
    candidate: Dict[str, Any]
    resume_summary: str = ""
    resume_skills: List[str] = []
    resume_text: str = ""

class RerankResponse(BaseModel):
    rerank_score: float
    decision: str
    strengths: List[Dict[str, Any]]
    gaps: List[Dict[str, Any]]
    why_ranked_here: str
    fallback_used: bool
    model: str

class ValidateExplanationRequest(BaseModel):
    strengths: List[Dict[str, Any]] = []
    gaps: List[Dict[str, Any]] = []
    resume_text: str = ""
    job_text: str = ""

class ValidateExplanationResponse(BaseModel):
    validated_strengths: List[Dict[str, Any]]
    validated_gaps: List[Dict[str, Any]]
