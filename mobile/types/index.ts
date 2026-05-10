export type PersonalInfo = {
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  location?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
};

export type EducationEntry = {
  institution: string;
  degree: string;
  year?: number | null;
};

export type ExperienceEntry = {
  company: string;
  title: string;
  startDate?: string | null;
  endDate?: string | null;
  current?: boolean;
  duration?: string | null;
};

export type ProjectEntry = {
  name: string;
  description: string;
  url?: string | null;
};

export type Certification = {
  name: string;
  issuer?: string | null;
  year?: string | null;
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
  certifications: Certification[];
  languages: string[];
  totalYearsExperience?: number | null;
  meta?: { confidenceScore?: number; processingTimeMs?: number };
};

export type ScoreBreakdown = {
  technicalSkills: number;
  experienceLevel: number;
  domainKnowledge: number;
  educationScore: number;
  certificationScore: number;
};

export type RankedCandidate = {
  id: string;
  name: string;
  title?: string | null;
  location?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedin?: string | null;
  github?: string | null;
  portfolio?: string | null;
  skills: string[];
  experienceLevel: string;
  totalYearsExperience?: number | null;
  matchScore: number;
  avatarUrl?: string | null;
  initials?: string | null;
  summary?: string | null;
  breakdown?: ScoreBreakdown | null;
  skillAnalysis?: { name: string; level: string; percent: number }[] | null;
  keywords?: string[] | null;
  experienceSummary?: { title: string; company: string; period: string; bullets?: string[] }[] | null;
};

export type UploadedResume = {
  id: string;
  fileName: string;
  mimeType: string;
  uri?: string;
  uploadedAt: string;
};

export type CriteriaWeights = {
  skills?: number;
  experience?: number;
  education?: number;
  certifications?: number;
};

export type JobWeights = {
  skills: number;
  experience: number;
  education: number;
  certifications: number;
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
  criteriaWeights?: JobWeights | null;
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
