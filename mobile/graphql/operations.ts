import { gql } from '@apollo/client';

export const UPLOAD_RESUME = gql`
  mutation UploadResume($input: UploadResumeInput!) {
    uploadResume(input: $input) {
      id
      fileName
      mimeType
    }
  }
`;

export const PARSE_RESUME = gql`
  mutation ParseResume($input: ParseResumeInput!) {
    parseResume(input: $input) {
      personalInfo {
        firstName
        lastName
        email
        phone
        location
      }
      skills
      techStack
      experienceLevel
      education {
        institution
        degree
        year
      }
      experience {
        company
        title
        startDate
        endDate
        current
      }
      meta {
        confidenceScore
        processingTimeMs
      }
    }
  }
`;

export const GET_EMBEDDINGS = gql`
  mutation GetEmbeddings($input: EmbeddingsInput!) {
    getEmbeddings(input: $input)
  }
`;

export const RANK_CANDIDATES = gql`
  mutation RankCandidates($input: RankCandidatesInput!) {
    rankCandidates(input: $input) {
      id
      name
      title
      location
      skills
      experienceLevel
      matchScore
      avatarUrl
      initials
      summary
      breakdown {
        technicalSkills
        experienceLevel
        domainKnowledge
      }
      skillAnalysis {
        name
        level
        percent
      }
      keywords
      experienceSummary {
        title
        company
        period
        bullets
      }
    }
  }
`;

export const REGISTER = gql`
  mutation Register($input: RegisterInput!) {
    register(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const LOGIN = gql`
  mutation Login($input: LoginInput!) {
    login(input: $input) {
      token
      user {
        id
        email
        firstName
        lastName
      }
    }
  }
`;

export const LOGOUT = gql`
  mutation Logout {
    logout
  }
`;

export const ME = gql`
  query Me {
    me {
      id
      email
      firstName
      lastName
    }
  }
`;

export const UPDATE_PROFILE = gql`
  mutation UpdateProfile($input: UpdateProfileInput!) {
    updateProfile(input: $input) {
      id
      email
      firstName
      lastName
    }
  }
`;
