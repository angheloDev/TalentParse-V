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
    }
  }
`;
