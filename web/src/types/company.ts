export interface Company {
  id: string;
  companyName: string;
  domain?: string;
  logoUrl?: string;
  industry?: string;
  companySize?: string;
  headquartersLocation?: string;
  sourceType?: string;
  cultureTagsJson: string[];
  interviewStyleJson: {
    rounds?: number;
    types?: string[];
    difficulty?: 'easy' | 'medium' | 'hard';
    notes?: string;
  };
  engineeringBlogsJson: { url: string; title: string; lastFetched?: string }[];
  fresherFriendly: boolean;
  publicHiringEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CompanyInsight {
  id: string;
  companyId: string;
  source: 'hn' | 'github' | 'rss' | 'manual';
  insightType: 'culture' | 'interview' | 'engineering' | 'hiring';
  rawText?: string;
  summarizedText?: string;
  tagsJson: string[];
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface InterviewQuestion {
  id: string;
  companyId?: string;
  roleType?: string;
  questionText: string;
  questionType?: 'coding' | 'system-design' | 'behavioral' | 'hr';
  difficultyLevel?: 'easy' | 'medium' | 'hard';
  source?: string;
  sourceUrl?: string;
  confidenceScore: number;
  createdAt: string;
  updatedAt: string;
}
