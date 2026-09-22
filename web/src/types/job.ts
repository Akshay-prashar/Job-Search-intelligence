export interface Job {
  id: string;
  companyId?: string;
  externalJobId?: string;
  jobTitle: string;
  roleType?: 'frontend' | 'backend' | 'fullstack' | 'devops' | 'data' | 'ml' | 'mobile';
  location?: string;
  remoteType: 'remote' | 'onsite' | 'hybrid' | 'unknown';
  experienceLevel: 'intern' | 'entry' | 'junior' | 'mid' | 'unknown';
  jobType?: string;
  department?: string;
  description?: string;
  responsibilities?: string;
  minimumQualifications?: string;
  preferredQualifications?: string;
  skillsJson: string[];
  salaryRange?: string;
  applyUrl?: string;
  source: string;
  sourceUrl?: string;
  postedAt?: string;
  expiryDate?: string;
  confidenceScore: number;
  jobStatus: 'active' | 'expired' | 'duplicate' | 'removed';
  createdAt: string;
  updatedAt: string;
}

export interface JobFilter {
  roleType?: string[];
  experienceLevel?: string[];
  remoteType?: string[];
  source?: string[];
  search?: string;
}
