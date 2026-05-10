type PythonCertification = { name: string; issuer?: string; year?: string };

type PythonParseResponse = {
  name?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  skills?: string[];
  experience?: string;
  education?: string;
  certifications?: PythonCertification[];
  rawText?: string;
};

function decodeBase64ToBuffer(fileBase64: string) {
  const clean = fileBase64.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(clean, 'base64');
}

function inferMimeType(mimeType: string, fileName: string): string {
  const m = mimeType.toLowerCase();
  if (m.includes('pdf')) return 'application/pdf';
  if (m.includes('wordprocessingml') || m.includes('officedocument.wordprocessingml')) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  const name = fileName.toLowerCase();
  if (name.endsWith('.pdf')) return 'application/pdf';
  if (name.endsWith('.docx')) return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  return mimeType;
}

export async function parseResumeViaPythonService(input: {
  fileBase64: string;
  fileName: string;
  mimeType: string;
}) {
  const resolvedMime = inferMimeType(input.mimeType, input.fileName);
  const isPdf = resolvedMime === 'application/pdf';
  const isDocx = resolvedMime.includes('wordprocessingml');

  if (!isPdf && !isDocx) {
    throw new Error('Only PDF and DOCX files are supported by the parser service.');
  }
  if (!input.fileBase64.trim()) {
    throw new Error('File content is required.');
  }

  const serviceUrl = process.env.PYTHON_RESUME_PARSER_URL ?? 'http://localhost:8000/parse-resume';
  const fileBuffer = decodeBase64ToBuffer(input.fileBase64);
  if (!fileBuffer.length) {
    throw new Error('Uploaded file is empty.');
  }

  const formData = new FormData();
  const fileBlob = new Blob([fileBuffer], { type: resolvedMime });
  formData.append('file', fileBlob, input.fileName || (isPdf ? 'resume.pdf' : 'resume.docx'));

  const response = await fetch(serviceUrl, { method: 'POST', body: formData });

  let payload: unknown = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  if (!response.ok) {
    const detail =
      typeof payload === 'object' && payload && 'detail' in payload && typeof payload.detail === 'string'
        ? payload.detail
        : 'Parser service error';
    throw new Error(detail);
  }

  const parsed = (payload ?? {}) as PythonParseResponse;

  return {
    name: parsed.name ?? '',
    email: parsed.email ?? '',
    phone: parsed.phone ?? '',
    linkedin: parsed.linkedin ?? '',
    github: parsed.github ?? '',
    portfolio: parsed.portfolio ?? '',
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: parsed.experience ?? '',
    education: parsed.education ?? '',
    certifications: Array.isArray(parsed.certifications)
      ? parsed.certifications.map((c) => ({
          name: c.name ?? '',
          issuer: c.issuer ?? '',
          year: c.year ?? '',
        }))
      : [],
    rawText: parsed.rawText ?? '',
  };
}
