export type PersonalInfo = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  location?: string;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  year?: number;
};

export type ExperienceEntry = {
  company: string;
  title: string;
  startDate?: string;
  endDate?: string | null;
  current?: boolean;
  duration?: string;
};

export type ParsedResume = {
  personalInfo: PersonalInfo;
  skills: string[];
  techStack: string[];
  experienceLevel: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  meta?: { confidenceScore?: number; processingTimeMs?: number };
};

export type ScoreBreakdown = {
  technicalSkills: number;
  experienceLevel: number;
  domainKnowledge: number;
};

export type RankedCandidate = {
  id: string;
  name: string;
  title?: string;
  location?: string;
  skills: string[];
  experienceLevel: string;
  matchScore: number;
  avatarUrl?: string;
  initials?: string;
  summary?: string;
  breakdown?: ScoreBreakdown;
  skillAnalysis?: { name: string; level: string; percent: number }[];
  keywords?: string[];
  experienceSummary?: { title: string; company: string; period: string; bullets?: string[] }[];
};

export type UploadedResume = {
  id: string;
  fileName: string;
  mimeType: string;
  uri?: string;
  uploadedAt: string;
};
