import { apolloClient } from '@/graphql/client';
import { GET_EMBEDDINGS, PARSE_RESUME, RANK_CANDIDATES, UPLOAD_RESUME } from '@/graphql/operations';
import type { ParsedResume, RankedCandidate } from '@/types';

export type UploadFileInput = {
  uri: string;
  name: string;
  mimeType: string;
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
        },
      },
    });
    if (!data?.uploadResume) throw new Error('Upload failed');
    return data.uploadResume;
  } catch (error) {
    throw normalizeError(error);
  }
}

export async function parseResume(text: string, fileNameHint?: string) {
  try {
    const { data } = await apolloClient.mutate<{ parseResume: ParsedResume }>({
      mutation: PARSE_RESUME,
      variables: {
        input: {
          text,
          fileName: fileNameHint,
        },
      },
    });
    if (!data?.parseResume) throw new Error('Parsing failed');
    return data.parseResume;
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

export async function rankCandidates(jobDescription: string) {
  if (!jobDescription.trim()) throw new Error('Job description is required');
  try {
    const { data } = await apolloClient.mutate<{ rankCandidates: RankedCandidate[] }>({
      mutation: RANK_CANDIDATES,
      variables: {
        input: {
          jobDescription,
        },
      },
    });
    return data?.rankCandidates ?? [];
  } catch (error) {
    throw normalizeError(error);
  }
}
