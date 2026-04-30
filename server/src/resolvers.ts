import { UploadedResumeModel, UserProfileModel } from './models.js';
import crypto from 'node:crypto';

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
  for (const skill of KNOWN_SKILLS) {
    if (lower.includes(skill)) hits.add(normalizeSkill(skill));
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

function scoreResume(jobDescription: string, parsed: ReturnType<typeof parseResumeText>) {
  const jdSkills = extractSkills(jobDescription);
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
  },
  Mutation: {
    uploadResume: async (
      _: unknown,
      { input }: { input: { fileName: string; mimeType: string; uri: string } },
    ) => {
      const saved = await UploadedResumeModel.create({
        fileName: input.fileName,
        mimeType: input.mimeType,
        uri: input.uri,
      });
      return {
        id: String(saved._id),
        fileName: saved.fileName,
        mimeType: saved.mimeType,
      };
    },
    parseResume: async (_: unknown, { input }: { input: { text: string; fileName?: string } }) => {
      const source = input.text.trim();
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
    rankCandidates: async (_: unknown, { input }: { input: { jobDescription: string } }) => {
      const resumes = await UploadedResumeModel.find().sort({ createdAt: -1 }).limit(50).lean();
      const candidates = resumes.map((resume) => {
        const parsed = (resume.parsed as ParsedResumeData | undefined) ?? parseResumeText(resume.rawText || resume.fileName);
        const score = scoreResume(input.jobDescription, parsed);
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
  },
};
