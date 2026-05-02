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

export type ProjectEntry = {
  name: string;
  description: string;
  url?: string | null;
};

export type ParsedResume = {
  personalInfo: PersonalInfo;
  skills: string[];
  techStack: string[];
  experienceLevel: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  achievements: string[];
  projects: ProjectEntry[];
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

export type SavedJobAnalysis = {
  id: string;
  industry: string;
  jobRole: string;
  requiredSkills: string[];
  yearsOfExperience: string;
  strengths: string;
  otherRequirements: string;
  rankedCandidateCount: number;
  rankedResumes: SavedRankedResume[];
  createdAt: string;
};

export type SavedRankedResume = {
  id: string;
  name: string;
  title?: string | null;
  location?: string | null;
  skills: string[];
  experienceLevel: string;
  matchScore: number;
  summary?: string | null;
  rankedAt: string;
};

export type LatestUploadJobContext = {
  jobId: string;
  industry: string;
  jobRole: string;
  requiredSkills: string[];
  yearsOfExperience: string;
  strengths: string;
  otherRequirements: string;
  uploadedResumeId: string;
};
