import { apolloClient } from '@/graphql/client';
import {
  DELETE_SAVED_JOB,
  GET_EMBEDDINGS,
  PARSE_RESUME,
  PARSE_RESUME_FILE,
  RANK_CANDIDATES,
  SAVED_JOB,
  SAVED_JOBS,
  SAVE_JOB_ANALYSIS,
  SAVE_JOB_RANKINGS,
  UPLOAD_RESUME,
} from '@/graphql/operations';
import type { ParsedResume, RankedCandidate, SavedJobAnalysis } from '@/types';

export type UploadFileInput = {
  uri: string;
  name: string;
  mimeType: string;
  fileHash: string;
};

function normalizeError(error: unknown) {
  if (error instanceof Error) return error;
  return new Error('Unexpected request error');
}

export async function uploadResume(file: UploadFileInput) {
  try {
    const { data } = await apolloClient.mutate<{ uploadResume: { id: string; fileName: string; mimeType: string } }>({
      mutation: UPLOAD_RESUME,
      variables: {
        input: {
          fileName: file.name,
          mimeType: file.mimeType,
          uri: file.uri,
          fileHash: file.fileHash,
        },
      },
    });
    if (!data?.uploadResume) throw new Error('Upload failed');
    return data.uploadResume;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function parseResume(
  text: string,
  fileNameHint?: string,
  pdfBase64?: string,
  mimeType?: string,
  resumeId?: string,
) {
  try {
    const { data } = await apolloClient.mutate<{ parseResume: ParsedResume }>({
      mutation: PARSE_RESUME,
      variables: {
        input: {
          ...(resumeId ? { resumeId } : {}),
          text,
          fileName: fileNameHint,
          pdfBase64,
          mimeType,
        },
      },
    });
    if (!data?.parseResume) throw new Error('Parsing failed');
    return data.parseResume;
  } catch (error) {
    throw normalizeError(error);
  }
}

export type ParsedResumeFileResult = {
  name: string;
  email: string;
  skills: string[];
  experience: string;
  education: string;
};

export async function parseResumeFile(fileBase64: string, fileName: string, mimeType: string) {
  try {
    const { data } = await apolloClient.mutate<{ parseResumeFile: ParsedResumeFileResult }>({
      mutation: PARSE_RESUME_FILE,
      variables: {
        input: {
          fileBase64,
          fileName,
          mimeType,
        },
      },
    });
    if (!data?.parseResumeFile) throw new Error('Failed to parse PDF resume');
    return data.parseResumeFile;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getEmbeddings(data: Record<string, unknown>) {
  try {
    const { data: response } = await apolloClient.mutate<{ getEmbeddings: string }>({
      mutation: GET_EMBEDDINGS,
      variables: {
        input: {
          payload: JSON.stringify(data),
        },
      },
    });
    if (!response?.getEmbeddings) throw new Error('Embedding generation failed');
    return response.getEmbeddings;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function rankCandidates(jobRole: string) {
  if (!jobRole.trim()) throw new Error('Job role is required');
  try {
    const { data } = await apolloClient.mutate<{ rankCandidates: RankedCandidate[] }>({
      mutation: RANK_CANDIDATES,
      variables: {
        input: {
          jobRole,
        },
      },
    });
    return data?.rankCandidates ?? [];
  } catch (error) {
    throw normalizeError(error);
  }
}

export type SaveJobAnalysisInput = {
  industry: string;
  jobRole: string;
  requiredSkills: string[];
  yearsOfExperience?: string;
  strengths?: string;
  otherRequirements?: string;
  rankedCandidateCount: number;
};

export async function saveJobAnalysis(input: SaveJobAnalysisInput) {
  try {
    const { data } = await apolloClient.mutate<{ saveJobAnalysis: SavedJobAnalysis }>({
      mutation: SAVE_JOB_ANALYSIS,
      variables: { input },
    });
    if (!data?.saveJobAnalysis) throw new Error('Failed to save job analysis');
    return data.saveJobAnalysis;
  } catch (error) {
    throw normalizeError(error);
  }
}

export type SaveJobRankingsInput = {
  jobId: string;
  rankings: Array<{
    id: string;
    name: string;
    title?: string | null;
    location?: string | null;
    skills: string[];
    experienceLevel: string;
    matchScore: number;
    summary?: string | null;
  }>;
};

export async function saveJobRankings(input: SaveJobRankingsInput) {
  try {
    const { data } = await apolloClient.mutate<{ saveJobRankings: SavedJobAnalysis }>({
      mutation: SAVE_JOB_RANKINGS,
      variables: { input },
    });
    if (!data?.saveJobRankings) throw new Error('Failed to save job rankings');
    return data.saveJobRankings;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSavedJobs() {
  try {
    const { data } = await apolloClient.query<{ savedJobs: SavedJobAnalysis[] }>({
      query: SAVED_JOBS,
      fetchPolicy: 'network-only',
    });
    return data?.savedJobs ?? [];
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function getSavedJob(id: string) {
  try {
    const { data } = await apolloClient.query<{ savedJob: SavedJobAnalysis | null }>({
      query: SAVED_JOB,
      variables: { id },
      fetchPolicy: 'network-only',
    });
    return data?.savedJob ?? null;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function deleteSavedJob(id: string) {
  try {
    const { data } = await apolloClient.mutate<{ deleteSavedJob: boolean }>({
      mutation: DELETE_SAVED_JOB,
      variables: { id },
    });
    return Boolean(data?.deleteSavedJob);
  } catch (error) {
    throw normalizeError(error);
  }
}
