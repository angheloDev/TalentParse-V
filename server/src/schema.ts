export const typeDefs = `#graphql
  type PersonalInfo {
    firstName: String!
    lastName: String!
    email: String
    phone: String
    location: String
  }

  type EducationEntry {
    institution: String!
    degree: String!
    year: Int
  }

  type ExperienceEntry {
    company: String!
    title: String!
    startDate: String
    endDate: String
    current: Boolean
    duration: String
  }

  type ProjectEntry {
    name: String!
    description: String!
    url: String
  }

  type ParseMeta {
    confidenceScore: Float
    processingTimeMs: Int
  }

  type ParsedResume {
    personalInfo: PersonalInfo!
    skills: [String!]!
    techStack: [String!]!
    experienceLevel: String!
    education: [EducationEntry!]!
    experience: [ExperienceEntry!]!
    achievements: [String!]!
    projects: [ProjectEntry!]!
    meta: ParseMeta
  }

  type ResumeParseResult {
    name: String!
    email: String!
    skills: [String!]!
    experience: String!
    education: String!
  }

  type UploadResult {
    id: ID!
    fileName: String!
    mimeType: String!
  }

  type ScoreBreakdown {
    technicalSkills: Float!
    experienceLevel: Float!
    domainKnowledge: Float!
  }

  type SkillAnalysisRow {
    name: String!
    level: String!
    percent: Float!
  }

  type ExperienceSummaryRow {
    title: String!
    company: String!
    period: String!
    bullets: [String!]
  }

  type RankedCandidate {
    id: ID!
    name: String!
    title: String
    location: String
    skills: [String!]!
    experienceLevel: String!
    matchScore: Float!
    avatarUrl: String
    initials: String
    summary: String
    breakdown: ScoreBreakdown
    skillAnalysis: [SkillAnalysisRow!]
    keywords: [String!]
    experienceSummary: [ExperienceSummaryRow!]
  }

  type UserProfile {
    id: ID!
    email: String!
    firstName: String!
    lastName: String!
  }

  type AuthPayload {
    token: String!
    user: UserProfile!
  }

  type SavedJob {
    id: ID!
    industry: String!
    jobRole: String!
    requiredSkills: [String!]!
    yearsOfExperience: String!
    strengths: String!
    otherRequirements: String!
    rankedCandidateCount: Int!
    rankedResumes: [SavedRankedResume!]!
    createdAt: String!
  }

  type SavedRankedResume {
    id: ID!
    name: String!
    title: String
    location: String
    skills: [String!]!
    experienceLevel: String!
    matchScore: Float!
    summary: String
    rankedAt: String!
  }

  input UploadResumeInput {
    fileName: String!
    mimeType: String!
    uri: String!
    fileHash: String!
  }

  input ParseResumeInput {
    resumeId: ID
    text: String!
    fileName: String
    pdfBase64: String
    mimeType: String
  }

  input ParseResumeFileInput {
    fileBase64: String!
    fileName: String!
    mimeType: String!
  }

  input EmbeddingsInput {
    payload: String!
  }

  input RankCandidatesInput {
    jobRole: String!
  }

  input RegisterInput {
    email: String!
    password: String!
    firstName: String!
    lastName: String!
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input UpdateProfileInput {
    email: String!
    firstName: String!
    lastName: String!
  }

  input SaveJobAnalysisInput {
    industry: String!
    jobRole: String!
    requiredSkills: [String!]!
    yearsOfExperience: String
    strengths: String
    otherRequirements: String
    rankedCandidateCount: Int!
  }

  input SaveJobRankingsInput {
    jobId: ID!
    rankings: [SavedRankingInput!]!
  }

  input SavedRankingInput {
    id: ID!
    name: String!
    title: String
    location: String
    skills: [String!]!
    experienceLevel: String!
    matchScore: Float!
    summary: String
  }

  type Mutation {
    uploadResume(input: UploadResumeInput!): UploadResult!
    parseResume(input: ParseResumeInput!): ParsedResume!
    parseResumeFile(input: ParseResumeFileInput!): ResumeParseResult!
    getEmbeddings(input: EmbeddingsInput!): String!
    rankCandidates(input: RankCandidatesInput!): [RankedCandidate!]!
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    updateProfile(input: UpdateProfileInput!): UserProfile!
    saveJobAnalysis(input: SaveJobAnalysisInput!): SavedJob!
    saveJobRankings(input: SaveJobRankingsInput!): SavedJob!
    deleteSavedJob(id: ID!): Boolean!
  }

  type Query {
    health: String!
    me: UserProfile
    savedJobs: [SavedJob!]!
    savedJob(id: ID!): SavedJob
  }
`;
