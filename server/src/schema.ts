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
    meta: ParseMeta
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

  input UploadResumeInput {
    fileName: String!
    mimeType: String!
    uri: String!
  }

  input ParseResumeInput {
    text: String!
    fileName: String
  }

  input EmbeddingsInput {
    payload: String!
  }

  input RankCandidatesInput {
    jobDescription: String!
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

  type Mutation {
    uploadResume(input: UploadResumeInput!): UploadResult!
    parseResume(input: ParseResumeInput!): ParsedResume!
    getEmbeddings(input: EmbeddingsInput!): String!
    rankCandidates(input: RankCandidatesInput!): [RankedCandidate!]!
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    logout: Boolean!
    updateProfile(input: UpdateProfileInput!): UserProfile!
  }

  type Query {
    health: String!
    me: UserProfile
  }
`;
