export type ApplicationStatus = 'to_apply' | 'applied' | 'interviewing' | 'rejected' | 'offer' | 'withdrawn';

export interface Application {
  id: string;
  userId: string;
  jobId: string;
  status: ApplicationStatus;
  appliedAt?: string;
  followUpDate?: string;
  notes?: string;
  interviewStage?: string;
  result?: string;
  createdAt: string;
  updatedAt: string;
  
  // Optional relations
  job?: {
    jobTitle: string;
    companyName?: string;
    location?: string;
    company?: {
      companyName: string;
      logoUrl?: string;
    }
  }
}
