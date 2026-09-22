export interface ParsedEducation {
  college: string;
  degree: string;
  graduationYear?: number;
  cgpa?: string;
}

export interface ParsedProject {
  name: string;
  description: string;
  techStack?: string[];
  url?: string;
}

export interface ParsedExperience {
  role: string;
  company: string;
  duration?: string;
  description?: string;
}

export interface Resume {
  id: string;
  userId: string;
  fileName: string;
  fileUrl?: string;
  mimeType: string;
  extractedText?: string;
  parsedSections: {
    education?: ParsedEducation[];
    projects?: ParsedProject[];
    experience?: ParsedExperience[];
  };
  skillsJson: string[];
  educationJson: ParsedEducation[];
  projectsJson: ParsedProject[];
  uploadStatus: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  updatedAt: string;
}
