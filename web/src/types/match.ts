export interface ScoreFactors {
  exact_skill: number;
  semantic: number;
  fresher_fit: number;
  role_relevance: number;
  logistics: number;
  recency: number;
  source_confidence: number;
  completeness: number;
}

export interface MatchExplanation {
  matched_skills: string[];
  missing_required: string[];
  missing_preferred: string[];
  fresher_fit_reason: string;
  logistics_reason: string;
  source_label: string;
  confidence_level: string;
  recency_note: string;
}

export interface JobMatch {
  id: string;
  userId: string;
  jobId: string;
  matchScore: number;
  exactMatchScore?: number;
  semanticScore?: number;
  fresherFitScore?: number;
  logisticsScore?: number;
  sourceConfidenceScore?: number;
  recencyScore?: number;
  completenessScore?: number;
  roleRelevanceScore?: number;
  explanationJson: MatchExplanation;
  createdAt: string;
  updatedAt: string;
}
