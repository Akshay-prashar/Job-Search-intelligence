export interface User {
  id: string;
  name: string;
  email: string;
  college?: string;
  branch?: string;
  graduationYear?: number;
  cgpa?: number;
  targetRoles: string[];
  preferredLocations: string[];
  preferredWorkMode: 'remote' | 'onsite' | 'hybrid' | 'any';
  resumeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkill {
  name: string;
  level: 'beginner' | 'intermediate' | 'expert';
  category: string;
}

export interface UserProfile {
  id: string;
  userId: string;
  headline?: string;
  bio?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  currentYear?: string;
  skillsJson: UserSkill[];
  achievementsJson: { title: string; description: string; date: string }[];
  preferencesJson: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}
