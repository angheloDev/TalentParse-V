import { SavedJobAnalysisModel, UploadedResumeModel, UserProfileModel } from './models.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

const KNOWN_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'node',
  'node.js',
  'python',
  'java',
  'c#',
  'sql',
  'mongodb',
  'graphql',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'gcp',
  'agile',
  'scrum',
  'jira',
  'figma',
  'next.js',
  'nestjs',
];

function toTitle(word: string) {
  return word
    .split(/[\s.-]+/)
    .filter(Boolean)
    .map((part) => part[0]!.toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function normalizeSkill(raw: string) {
  const lower = raw.toLowerCase();
  if (lower === 'node.js') return 'Node.js';
  if (lower === 'next.js') return 'Next.js';
  return toTitle(raw);
}

function extractSkills(text: string) {
  const lower = text.toLowerCase();
  const hits = new Set<string>();

  // Start with known-skill dictionary matches.
  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill)) hits.add(normalizeSkill(skill));
  }

  // Then pull likely skills from "skills" sections and technical tokens.
  const fromSkillsSection = text.match(/(?:skills?|tech(?:nical)? stack)\s*[:\-]\s*([^\n]+)/gi) ?? [];
  for (const row of fromSkillsSection) {
    const section = row.split(/[:\-]/).slice(1).join(' ');
    for (const token of section.split(/[,|/]/)) {
      const cleaned = token.trim();
      if (cleaned.length >= 2 && cleaned.length <= 40) hits.add(normalizeSkill(cleaned));
    }
  }

  const technicalTokens = text.match(/\b[a-zA-Z][a-zA-Z0-9+.#-]{1,24}\b/g) ?? [];
  for (const token of technicalTokens) {
    const lowerToken = token.toLowerCase();
    if (
      KNOWN_SKILLS.includes(lowerToken) ||
      /^(react|node|nestjs|next|typescript|javascript|python|java|graphql|docker|kubernetes|aws|azure|gcp|sql|mongodb|postgresql)$/i.test(
        token,
      )
    ) {
      hits.add(normalizeSkill(token));
    }
  }

  return Array.from(hits);
}

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string) {
  return text.match(/(\+?\d[\d\s\-()]{7,}\d)/)?.[0] ?? null;
}

function parseResumeText(text: string) {
  const startedAt = Date.now();
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? 'Unknown Candidate';
  const [firstName = 'Unknown', ...restName] = firstLine.split(/\s+/);
  const lastName = restName.join(' ') || 'Candidate';
  const skills = extractSkills(text);
  const hasSeniorSignals = /(senior|lead|principal|8\+?\s*years|10\+?\s*years)/i.test(text);
  const hasMidSignals = /(mid|3\+?\s*years|4\+?\s*years|5\+?\s*years)/i.test(text);
  const experienceLevel = hasSeniorSignals ? 'Senior' : hasMidSignals ? 'Mid' : 'Junior';
  const location =
    lines.find((line) => /(remote|, [A-Z]{2}$|united states|philippines|singapore)/i.test(line)) ?? null;

  return {
    personalInfo: {
      firstName,
      lastName,
      email: extractEmail(text),
      phone: extractPhone(text),
      location,
    },
    skills,
    techStack: skills.slice(0, 6),
    experienceLevel,
    education: [
      {
        institution: 'Not specified',
        degree: 'Not specified',
        year: null,
      },
    ],
    experience: [
      {
        company: 'Not specified',
        title: experienceLevel === 'Senior' ? 'Senior Professional' : 'Professional',
        startDate: null,
        endDate: null,
        current: true,
        duration: null,
      },
    ],
    meta: {
      confidenceScore: skills.length ? 0.9 : 0.72,
      processingTimeMs: Date.now() - startedAt,
    },
  };
}

function scoreResume(jobRole: string, parsed: ReturnType<typeof parseResumeText>) {
  const jdSkills = extractSkills(jobRole);
  const candidateSkills = parsed.skills.map((skill) => skill.toLowerCase());
  const matched = jdSkills.filter((skill) => candidateSkills.includes(skill.toLowerCase()));
  const technicalSkills = jdSkills.length ? Math.round((matched.length / jdSkills.length) * 100) : 60;
  const experienceLevel =
    parsed.experienceLevel === 'Senior' ? 92 : parsed.experienceLevel === 'Mid' ? 80 : 68;
  const domainKnowledge = Math.max(55, Math.min(95, Math.round((technicalSkills + experienceLevel) / 2)));
  const matchScore = Math.round(technicalSkills * 0.55 + experienceLevel * 0.3 + domainKnowledge * 0.15);
  return { technicalSkills, experienceLevel, domainKnowledge, matchScore, matched };
}

type ParsedResumeData = ReturnType<typeof parseResumeText>;
type ResolverContext = { token: string | null };

async function extractPdfText(pdfBase64: string) {
  const clean = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
  const buffer = Buffer.from(clean, 'base64');
  const pdfParseModule = await import('pdf-parse');
  const parser = new pdfParseModule.PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text ?? '').trim();
  } finally {
    await parser.destroy();
  }
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user: {
  _id: unknown;
  email: string;
  firstName: string;
  lastName: string;
}) {
  return {
    id: String(user._id),
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

function sanitizeSavedJob(job: {
  _id: unknown;
  industry: string;
  jobRole: string;
  requiredSkills?: string[];
  yearsOfExperience?: string;
  strengths?: string;
  otherRequirements?: string;
  rankedCandidateCount: number;
  rankedResumes?: Array<{
    id: string;
    name: string;
    title?: string | null;
    location?: string | null;
    skills?: string[];
    experienceLevel: string;
    matchScore: number;
    summary?: string | null;
    rankedAt?: Date;
  }>;
  createdAt?: Date;
}) {
  return {
    id: String(job._id),
    industry: job.industry,
    jobRole: job.jobRole,
    requiredSkills: job.requiredSkills ?? [],
    yearsOfExperience: job.yearsOfExperience ?? '',
    strengths: job.strengths ?? '',
    otherRequirements: job.otherRequirements ?? '',
    rankedCandidateCount: job.rankedCandidateCount,
    rankedResumes: (job.rankedResumes ?? []).map((ranked) => ({
      id: ranked.id,
      name: ranked.name,
      title: ranked.title ?? null,
      location: ranked.location ?? null,
      skills: ranked.skills ?? [],
      experienceLevel: ranked.experienceLevel,
      matchScore: ranked.matchScore,
      summary: ranked.summary ?? null,
      rankedAt: (ranked.rankedAt ?? new Date()).toISOString(),
    })),
    createdAt: (job.createdAt ?? new Date()).toISOString(),
  };
}

async function getAuthedUser(token: string | null) {
  if (!token) return null;
  return UserProfileModel.findOne({
    sessionToken: token,
    sessionExpiresAt: { $gt: new Date() },
  });
}

export const resolvers = {
  Query: {
    health: () => 'ok',
    me: async (_: unknown, __: unknown, context: ResolverContext) => {
      const user = await getAuthedUser(context.token);
      return user ? sanitizeUser(user) : null;
    },
    savedJobs: async (_: unknown, __: unknown, context: ResolverContext) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      const rows = await SavedJobAnalysisModel.find({ userId: user._id }).sort({ createdAt: -1 }).lean();
      return rows.map((row) => sanitizeSavedJob(row as unknown as Parameters<typeof sanitizeSavedJob>[0]));
    },
    savedJob: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      if (!mongoose.Types.ObjectId.isValid(id)) return null;
      const row = await SavedJobAnalysisModel.findOne({ _id: id, userId: user._id }).lean();
      if (!row) return null;
      return sanitizeSavedJob(row as unknown as Parameters<typeof sanitizeSavedJob>[0]);
    },
  },
  Mutation: {
    uploadResume: async (
      _: unknown,
      { input }: { input: { fileName: string; mimeType: string; uri: string; fileHash: string } },
    ) => {
      const incomingHash = input.fileHash.trim();
      if (!incomingHash) throw new Error('Unable to fingerprint resume file.');
      const existing = await UploadedResumeModel.findOne({ fileHash: incomingHash }).lean();
      if (existing) throw new Error('This resume was already scanned.');
      const saved = await UploadedResumeModel.create({
        fileName: input.fileName,
        mimeType: input.mimeType,
        uri: input.uri,
        fileHash: incomingHash,
      });
      return {
        id: String(saved._id),
        fileName: saved.fileName,
        mimeType: saved.mimeType,
      };
    },
    parseResume: async (
      _: unknown,
      { input }: { input: { text: string; fileName?: string; pdfBase64?: string; mimeType?: string } },
    ) => {
      let source = input.text.trim();
      const isPdf = (input.mimeType ?? '').toLowerCase() === 'application/pdf';
      if (!source && isPdf && input.pdfBase64) {
        source = await extractPdfText(input.pdfBase64);
      }
      const parsed = parseResumeText(source.length ? source : input.fileName ?? 'Unknown Candidate');
      if (input.fileName) {
        await UploadedResumeModel.findOneAndUpdate(
          { fileName: input.fileName },
          { $set: { parsed, rawText: source } },
          { sort: { createdAt: -1 } },
        );
      }
      return parsed;
    },
    getEmbeddings: (_: unknown, { input }: { input: { payload: string } }) => {
      const tokens = input.payload
        .toLowerCase()
        .split(/[^a-z0-9+.#]+/i)
        .filter(Boolean);
      const unique = new Set(tokens);
      return JSON.stringify({
        dims: 384,
        tokenCount: tokens.length,
        uniqueTokenCount: unique.size,
        checksum: Array.from(unique)
          .slice(0, 12)
          .join('|'),
      });
    },
    rankCandidates: async (_: unknown, { input }: { input: { jobRole: string } }) => {
      const resumes = await UploadedResumeModel.find().sort({ createdAt: -1 }).limit(50).lean();
      const candidates = resumes.map((resume) => {
        const parsed = (resume.parsed as ParsedResumeData | undefined) ?? parseResumeText(resume.rawText || resume.fileName);
        const score = scoreResume(input.jobRole, parsed);
        const name = `${parsed.personalInfo.firstName} ${parsed.personalInfo.lastName}`.trim();
        return {
          id: String(resume._id),
          name,
          title: parsed.experience[0]?.title ?? 'Candidate',
          location: parsed.personalInfo.location ?? 'Unknown',
          skills: parsed.skills,
          experienceLevel: parsed.experienceLevel,
          matchScore: score.matchScore,
          initials: `${parsed.personalInfo.firstName[0] ?? ''}${parsed.personalInfo.lastName[0] ?? ''}`.toUpperCase(),
          summary: `Matched ${score.matched.length} relevant skills for this role.`,
          breakdown: {
            technicalSkills: score.technicalSkills,
            experienceLevel: score.experienceLevel,
            domainKnowledge: score.domainKnowledge,
          },
          skillAnalysis: parsed.skills.slice(0, 6).map((skill: string) => ({
            name: skill,
            level: parsed.experienceLevel,
            percent: score.matched.map((s) => s.toLowerCase()).includes(skill.toLowerCase()) ? 92 : 72,
          })),
          keywords: score.matched.length ? score.matched : parsed.skills.slice(0, 8),
          experienceSummary: parsed.experience.map((entry: ParsedResumeData['experience'][number]) => ({
            title: entry.title,
            company: entry.company,
            period: entry.duration ?? 'Not specified',
            bullets: [],
          })),
        };
      });
      return candidates.sort((a, b) => b.matchScore - a.matchScore);
    },
    register: async (
      _: unknown,
      {
        input,
      }: {
        input: { email: string; password: string; firstName: string; lastName: string };
      },
    ) => {
      const email = input.email.trim().toLowerCase();
      const existing = await UserProfileModel.findOne({ email });
      if (existing) throw new Error('Email already in use');
      if (input.password.length < 8) throw new Error('Password must be at least 8 characters');
      const salt = crypto.randomBytes(16).toString('hex');
      const passwordHash = `${salt}:${hashPassword(input.password, salt)}`;
      const token = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      const saved = await UserProfileModel.create({
        email,
        firstName: input.firstName.trim(),
        lastName: input.lastName.trim(),
        passwordHash,
        sessionToken: token,
        sessionExpiresAt,
      });
      return { token, user: sanitizeUser(saved) };
    },
    login: async (_: unknown, { input }: { input: { email: string; password: string } }) => {
      const email = input.email.trim().toLowerCase();
      const user = await UserProfileModel.findOne({ email });
      if (!user) throw new Error('Invalid credentials');
      const [salt, expectedHash] = user.passwordHash.split(':');
      const actualHash = hashPassword(input.password, salt);
      if (actualHash !== expectedHash) throw new Error('Invalid credentials');
      const token = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 14);
      user.sessionToken = token;
      user.sessionExpiresAt = sessionExpiresAt;
      await user.save();
      return { token, user: sanitizeUser(user) };
    },
    logout: async (_: unknown, __: unknown, context: ResolverContext) => {
      const user = await getAuthedUser(context.token);
      if (!user) return true;
      user.sessionToken = null;
      user.sessionExpiresAt = null;
      await user.save();
      return true;
    },
    updateProfile: async (
      _: unknown,
      { input }: { input: { email: string; firstName: string; lastName: string } },
      context: ResolverContext,
    ) => {
      const authed = await getAuthedUser(context.token);
      if (!authed) throw new Error('Unauthorized');
      const nextEmail = input.email.trim().toLowerCase();
      if (nextEmail !== authed.email) {
        const inUse = await UserProfileModel.findOne({ email: nextEmail, _id: { $ne: authed._id } });
        if (inUse) throw new Error('Email already in use');
      }
      authed.email = nextEmail;
      authed.firstName = input.firstName.trim();
      authed.lastName = input.lastName.trim();
      await authed.save();
      return sanitizeUser(authed);
    },
    saveJobAnalysis: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          industry: string;
          jobRole: string;
          requiredSkills: string[];
          yearsOfExperience?: string;
          strengths?: string;
          otherRequirements?: string;
          rankedCandidateCount: number;
        };
      },
      context: ResolverContext,
    ) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      const saved = await SavedJobAnalysisModel.create({
        userId: user._id,
        industry: input.industry.trim(),
        jobRole: input.jobRole.trim(),
        requiredSkills: input.requiredSkills.map((s) => s.trim()).filter(Boolean),
        yearsOfExperience: input.yearsOfExperience?.trim() ?? '',
        strengths: input.strengths?.trim() ?? '',
        otherRequirements: input.otherRequirements?.trim() ?? '',
        rankedCandidateCount: Math.max(0, input.rankedCandidateCount),
        rankedResumes: [],
      });
      return sanitizeSavedJob(saved);
    },
    saveJobRankings: async (
      _: unknown,
      {
        input,
      }: {
        input: {
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
      },
      context: ResolverContext,
    ) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      if (!mongoose.Types.ObjectId.isValid(input.jobId)) throw new Error('Invalid job id');

      const normalized = [...input.rankings]
        .map((ranked) => ({
          id: String(ranked.id),
          name: ranked.name.trim(),
          title: ranked.title?.trim() || null,
          location: ranked.location?.trim() || null,
          skills: ranked.skills.map((s) => s.trim()).filter(Boolean),
          experienceLevel: ranked.experienceLevel.trim(),
          matchScore: Math.max(0, ranked.matchScore),
          summary: ranked.summary?.trim() || null,
          rankedAt: new Date(),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      const updated = await SavedJobAnalysisModel.findOneAndUpdate(
        { _id: input.jobId, userId: user._id },
        {
          $set: {
            rankedResumes: normalized,
            rankedCandidateCount: normalized.length,
          },
        },
        { new: true },
      );
      if (!updated) throw new Error('Saved job not found');
      return sanitizeSavedJob(updated);
    },
    deleteSavedJob: async (_: unknown, { id }: { id: string }, context: ResolverContext) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      if (!mongoose.Types.ObjectId.isValid(id)) return false;
      const deleted = await SavedJobAnalysisModel.findOneAndDelete({ _id: id, userId: user._id });
      return Boolean(deleted);
    },
  },
};
