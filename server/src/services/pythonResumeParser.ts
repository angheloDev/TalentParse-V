type PythonParseResponse = {
  name?: string;
  email?: string;
  skills?: string[];
  experience?: string;
  education?: string;
};

function decodeBase64ToBuffer(fileBase64: string) {
  const clean = fileBase64.replace(/^data:application\/pdf;base64,/, '');
  return Buffer.from(clean, 'base64');
}

export async function parseResumeViaPythonService(input: {
  fileBase64: string;
  fileName: string;
  mimeType: string;
}) {
  if (input.mimeType !== 'application/pdf') {
    throw new Error('Invalid file type. Only PDF files are supported.');
  }
  if (!input.fileBase64.trim()) {
    throw new Error('PDF file is required.');
  }

  const serviceUrl = process.env.PYTHON_RESUME_PARSER_URL ?? 'http://localhost:8000/parse-resume';
  const fileBuffer = decodeBase64ToBuffer(input.fileBase64);
  if (!fileBuffer.length) {
    throw new Error('Uploaded PDF is empty.');
  }

  const formData = new FormData();
  const fileBlob = new Blob([fileBuffer], { type: input.mimeType });
  formData.append('file', fileBlob, input.fileName || 'resume.pdf');

  const response = await fetch(serviceUrl, {
    method: 'POST',
    body: formData,
  });

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
    throw new Error(typeof detail === 'string' ? detail : 'Parser service error');
  }

  const parsed = (payload ?? {}) as PythonParseResponse;

  return {
    name: parsed.name ?? '',
    email: parsed.email ?? '',
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    experience: parsed.experience ?? '',
    education: parsed.education ?? '',
  };
}
