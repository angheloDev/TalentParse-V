import { SavedJobAnalysisModel, UploadedResumeModel, UserProfileModel } from './models.js';
import { parseResumeViaPythonService } from './services/pythonResumeParser.js';
import crypto from 'node:crypto';
import mongoose from 'mongoose';

// ---------------------------------------------------------------------------
// Skill dictionary — canonical name → lower-case search variants
// Word-boundary matching ensures "Java" won't hit "JavaScript", etc.
// ---------------------------------------------------------------------------
const SKILL_SYNONYMS: Record<string, string[]> = {
  // Programming Languages
  JavaScript: ['javascript', 'js', 'ecmascript', 'es6', 'es2015', 'es2016', 'es2017', 'es2018', 'es2019', 'es2020'],
  TypeScript: ['typescript', 'ts'],
  Python: ['python', 'py', 'python3', 'python2'],
  Java: ['java'],
  'C#': ['c#', 'csharp', 'c sharp'],
  'C++': ['c++', 'cpp', 'c plus plus'],
  Go: ['golang', 'go language'],
  Rust: ['rust', 'rustlang'],
  Swift: ['swift'],
  Kotlin: ['kotlin'],
  PHP: ['php'],
  Ruby: ['ruby'],
  Scala: ['scala'],
  Dart: ['dart'],
  Elixir: ['elixir'],
  Haskell: ['haskell'],
  Lua: ['lua'],
  'Objective-C': ['objective-c', 'objc', 'objective c'],
  Bash: ['bash', 'shell scripting', 'shell script'],
  PowerShell: ['powershell', 'pwsh'],
  Groovy: ['groovy'],
  Perl: ['perl'],
  MATLAB: ['matlab'],
  // Frontend
  React: ['react', 'reactjs', 'react.js'],
  'Vue.js': ['vue', 'vuejs', 'vue.js', 'vue 3', 'vue3'],
  Angular: ['angular', 'angularjs'],
  Svelte: ['svelte', 'sveltekit'],
  'Next.js': ['next.js', 'nextjs', 'next js'],
  'Nuxt.js': ['nuxt', 'nuxt.js', 'nuxtjs'],
  Gatsby: ['gatsby'],
  HTML: ['html', 'html5'],
  CSS: ['css', 'css3'],
  Sass: ['sass', 'scss'],
  'Tailwind CSS': ['tailwind', 'tailwindcss', 'tailwind css'],
  Bootstrap: ['bootstrap'],
  'Material UI': ['material ui', 'mui', 'material-ui'],
  'Chakra UI': ['chakra ui', 'chakra'],
  Redux: ['redux', 'redux toolkit'],
  MobX: ['mobx'],
  Zustand: ['zustand'],
  Webpack: ['webpack'],
  Vite: ['vite', 'vitejs'],
  Babel: ['babel'],
  jQuery: ['jquery'],
  Storybook: ['storybook'],
  Cypress: ['cypress'],
  Playwright: ['playwright'],
  Selenium: ['selenium'],
  Jest: ['jest'],
  // Backend
  'Node.js': ['node.js', 'nodejs', 'node js'],
  Express: ['express', 'express.js', 'expressjs'],
  NestJS: ['nestjs', 'nest.js'],
  Django: ['django'],
  Flask: ['flask'],
  FastAPI: ['fastapi'],
  'Spring Boot': ['spring boot', 'springboot'],
  Spring: ['spring framework', 'spring mvc'],
  Laravel: ['laravel'],
  'Ruby on Rails': ['rails', 'ruby on rails', 'ror'],
  'ASP.NET': ['asp.net', 'aspnet', 'asp.net core'],
  Gin: ['gin-gonic', 'gin gonic'],
  Fastify: ['fastify'],
  Koa: ['koa.js'],
  Strapi: ['strapi'],
  Hibernate: ['hibernate'],
  SQLAlchemy: ['sqlalchemy'],
  // Databases
  PostgreSQL: ['postgresql', 'postgres', 'pgsql'],
  MySQL: ['mysql'],
  MongoDB: ['mongodb', 'mongo'],
  Redis: ['redis'],
  Elasticsearch: ['elasticsearch', 'elastic search'],
  Cassandra: ['cassandra', 'apache cassandra'],
  SQLite: ['sqlite'],
  'SQL Server': ['sql server', 'mssql'],
  DynamoDB: ['dynamodb', 'dynamo db'],
  Firebase: ['firebase', 'firestore'],
  Supabase: ['supabase'],
  Neo4j: ['neo4j'],
  Snowflake: ['snowflake'],
  BigQuery: ['bigquery'],
  'Amazon Redshift': ['redshift', 'aws redshift'],
  Databricks: ['databricks'],
  RabbitMQ: ['rabbitmq', 'rabbit mq'],
  'Apache Kafka': ['kafka', 'apache kafka'],
  Prisma: ['prisma'],
  TypeORM: ['typeorm'],
  Sequelize: ['sequelize'],
  Mongoose: ['mongoose'],
  // Cloud & Infrastructure
  AWS: ['aws', 'amazon web services'],
  'Microsoft Azure': ['azure', 'microsoft azure'],
  'Google Cloud': ['gcp', 'google cloud', 'google cloud platform'],
  Docker: ['docker'],
  Kubernetes: ['kubernetes', 'k8s'],
  Terraform: ['terraform'],
  Ansible: ['ansible'],
  Puppet: ['puppet'],
  Helm: ['helm'],
  Istio: ['istio'],
  Prometheus: ['prometheus'],
  Grafana: ['grafana'],
  Datadog: ['datadog'],
  'New Relic': ['new relic', 'newrelic'],
  Cloudflare: ['cloudflare'],
  Vercel: ['vercel'],
  Netlify: ['netlify'],
  Heroku: ['heroku'],
  Linux: ['linux', 'ubuntu', 'centos', 'debian'],
  Nginx: ['nginx'],
  Serverless: ['serverless', 'aws lambda', 'azure functions'],
  Microservices: ['microservices', 'microservice'],
  // CI/CD
  Git: ['git'],
  GitHub: ['github'],
  GitLab: ['gitlab'],
  'GitHub Actions': ['github actions'],
  Jenkins: ['jenkins'],
  CircleCI: ['circleci', 'circle ci'],
  'Travis CI': ['travis ci', 'travis'],
  ArgoCD: ['argocd', 'argo cd'],
  // Data & ML
  TensorFlow: ['tensorflow', 'tf'],
  PyTorch: ['pytorch', 'torch'],
  'scikit-learn': ['scikit-learn', 'sklearn', 'scikit learn'],
  Pandas: ['pandas'],
  NumPy: ['numpy'],
  Matplotlib: ['matplotlib'],
  'Apache Spark': ['pyspark', 'apache spark'],
  'Apache Airflow': ['airflow', 'apache airflow'],
  dbt: ['dbt'],
  'Power BI': ['power bi', 'powerbi'],
  Tableau: ['tableau'],
  Looker: ['looker', 'looker studio'],
  'Machine Learning': ['machine learning'],
  'Deep Learning': ['deep learning', 'neural network', 'neural networks'],
  NLP: ['nlp', 'natural language processing'],
  'Computer Vision': ['computer vision', 'image recognition'],
  LangChain: ['langchain'],
  MLflow: ['mlflow'],
  'Amazon SageMaker': ['sagemaker', 'aws sagemaker'],
  'Vertex AI': ['vertex ai'],
  'Hugging Face': ['hugging face', 'huggingface'],
  // Mobile
  'React Native': ['react native', 'react-native'],
  Flutter: ['flutter'],
  SwiftUI: ['swiftui', 'swift ui'],
  'Jetpack Compose': ['jetpack compose'],
  Ionic: ['ionic'],
  Expo: ['expo'],
  // APIs & Protocols
  GraphQL: ['graphql', 'gql'],
  'REST API': ['rest api', 'restful', 'rest apis', 'restful api'],
  gRPC: ['grpc'],
  WebSocket: ['websocket', 'websockets'],
  OAuth: ['oauth', 'oauth2'],
  JWT: ['jwt', 'json web token'],
  OpenAPI: ['openapi', 'swagger'],
  // Testing
  pytest: ['pytest'],
  JUnit: ['junit'],
  TDD: ['tdd', 'test driven development', 'test-driven development'],
  BDD: ['bdd', 'behavior driven development'],
  // Methodologies & practices
  Agile: ['agile', 'agile methodology'],
  Scrum: ['scrum'],
  Kanban: ['kanban'],
  DevOps: ['devops', 'dev ops'],
  'CI/CD': ['ci/cd', 'cicd', 'continuous integration', 'continuous deployment', 'continuous delivery'],
  'Domain-Driven Design': ['ddd', 'domain driven design', 'domain-driven design'],
  'Clean Architecture': ['clean architecture'],
  'Design Patterns': ['design patterns'],
  // Tools
  Jira: ['jira'],
  Confluence: ['confluence'],
  Figma: ['figma'],
  'Adobe XD': ['adobe xd'],
  Postman: ['postman'],
  Insomnia: ['insomnia'],
  Sentry: ['sentry'],
  Splunk: ['splunk'],
  // Security
  Cybersecurity: ['cybersecurity', 'cyber security', 'information security'],
  'Penetration Testing': ['penetration testing', 'pentesting', 'pen testing'],
  OWASP: ['owasp'],
};

// Build a fast lookup map: normalised token → canonical skill name
const SKILLS_LOOKUP = new Map<string, string>();
for (const [canonical, variants] of Object.entries(SKILL_SYNONYMS)) {
  for (const v of variants) {
    SKILLS_LOOKUP.set(v.toLowerCase(), canonical);
  }
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeToken(input: string) {
  return input.toLowerCase().replace(/[^a-z0-9+.#/\-]/g, '');
}

// Spoken / written languages — always extract these regardless of job preference
const SPOKEN_LANGUAGES = [
  'English', 'Spanish', 'French', 'German', 'Mandarin', 'Chinese', 'Japanese',
  'Korean', 'Arabic', 'Portuguese', 'Italian', 'Russian', 'Dutch', 'Hindi',
  'Bengali', 'Urdu', 'Tagalog', 'Vietnamese', 'Thai', 'Polish', 'Turkish',
  'Swedish', 'Norwegian', 'Danish', 'Finnish', 'Greek', 'Hebrew', 'Persian',
  'Malay', 'Indonesian',
];

const CERTIFICATION_PATTERNS: RegExp[] = [
  /\bAWS\s+Certified[^.\n]{0,80}/gi,
  /\bGoogle\s+(?:Certified|Professional|Associate)[^.\n]{0,60}/gi,
  /\bMicrosoft\s+Certified[^.\n]{0,60}/gi,
  /\bOracle\s+Certified[^.\n]{0,60}/gi,
  /\bCertified\s+(?:Kubernetes|ScrumMaster|Scrum\s+Master|Product\s+Owner|Cloud\s+Engineer|Data\s+Professional)[^.\n]{0,60}/gi,
  /\b(?:PMP|CISSP|CEH|CISM|CISA|CPA|CFA|TOGAF)\b[^.\n]{0,40}/gi,
  /\bCompTIA\s+(?:A\+|Network\+|Security\+|Cloud\+|CySA\+|CASP\+)[^.\n]{0,40}/gi,
];

// ---------------------------------------------------------------------------
// Extraction helpers
// ---------------------------------------------------------------------------

function extractEmail(text: string) {
  return text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(text: string) {
  return text.match(/(\+?\d[\d\s\-().]{7,20}\d)/)?.[0]?.replace(/\s+/g, ' ').trim() ?? null;
}

function extractLinkedin(text: string): string | null {
  const m = text.match(/linkedin\.com\/in\/([A-Za-z0-9\-_%]+)/i);
  return m ? `https://linkedin.com/in/${m[1]}` : null;
}

function extractGithub(text: string): string | null {
  const m = text.match(/github\.com\/([A-Za-z0-9\-]+)/i);
  return m ? `https://github.com/${m[1]}` : null;
}

function extractPortfolio(text: string): string | null {
  const matches = [...text.matchAll(/https?:\/\/(?!(?:www\.)?(?:linkedin|github)\.com)[^\s<>"'()]+/gi)];
  return matches[0]?.[0]?.replace(/[.,;]+$/, '') ?? null;
}

function extractCertifications(text: string): Array<{ name: string; issuer: string | null; year: string | null }> {
  const certs: Array<{ name: string; issuer: string | null; year: string | null }> = [];
  const seen = new Set<string>();
  for (const pattern of CERTIFICATION_PATTERNS) {
    for (const m of text.matchAll(pattern)) {
      const raw = m[0].trim();
      const key = raw.toLowerCase().slice(0, 40);
      if (!seen.has(key) && raw.length > 4 && raw.length < 200) {
        seen.add(key);
        const yearM = raw.match(/\b(20\d{2})\b/);
        certs.push({
          name: raw.replace(/\b20\d{2}\b/g, '').trim(),
          issuer: null,
          year: yearM?.[1] ?? null,
        });
      }
    }
  }
  return certs;
}

function extractLanguages(text: string): string[] {
  const found: string[] = [];
  // Check in a "Languages:" section first
  const sectionMatch = text.match(/\blanguages?\s*[:\-]\s*([^\n]{4,200})/i);
  const haystack = sectionMatch ? sectionMatch[1] : text;
  for (const lang of SPOKEN_LANGUAGES) {
    if (new RegExp(`\\b${lang}\\b`, 'i').test(haystack)) {
      found.push(lang);
    }
  }
  return [...new Set(found)];
}

function extractTotalYearsExperience(text: string): number | null {
  const m = text.match(/(\d+(?:\.\d+)?)\+?\s*years?\s+(?:of\s+)?(?:professional\s+)?experience/i);
  if (m) return parseFloat(m[1]);

  // Infer from date span in the text
  const currentYear = new Date().getFullYear();
  const yearHits = [...text.matchAll(/\b(19|20)(\d{2})\b/g)].map((x) => parseInt(x[0], 10));
  if (yearHits.length >= 2) {
    const minYear = Math.min(...yearHits);
    const maxYear = Math.min(Math.max(...yearHits), currentYear);
    const span = maxYear - minYear;
    if (span >= 1 && span <= 50) return span;
  }
  return null;
}

/** Extract skills from resume text using word-boundary matching on all known synonyms. */
function extractSkills(text: string): string[] {
  const hits = new Set<string>();

  for (const [canonical, variants] of Object.entries(SKILL_SYNONYMS)) {
    for (const variant of variants) {
      // Use a lookaround so that special chars like + # . / work without splitting on \b
      const pattern = new RegExp(`(?<![a-z0-9])${escapeRegex(variant)}(?![a-z0-9])`, 'i');
      if (pattern.test(text)) {
        hits.add(canonical);
        break;
      }
    }
  }

  // Extra pass: parse skill-list sections (comma / pipe / bullet delimited)
  const sectionMatches = text.matchAll(
    /(?:technical\s+)?skills?(?:\s+&\s+\w+)?(?:\s+\/\s+\w+)?\s*[:\-]\s*([^\n]{5,400})/gi,
  );
  for (const sec of sectionMatches) {
    const items = sec[1].split(/[,|•·\/\t]+/).map((s) => s.trim()).filter(Boolean);
    for (const item of items) {
      if (item.length < 2 || item.length > 55) continue;
      const found = SKILLS_LOOKUP.get(item.toLowerCase());
      if (found) hits.add(found);
    }
  }

  return [...hits];
}

function extractMeaningKeywords(text: string) {
  const keywordSet = new Set<string>();
  for (const word of text.toLowerCase().split(/[^a-z0-9+.#/]+/)) {
    if (word.length > 2) keywordSet.add(word);
  }
  return keywordSet;
}

/** Score education entries on a 0-100 scale. */
function scoreEducation(education: Array<{ degree: string }> | undefined): number {
  if (!education?.length) return 60;
  let best = 60;
  for (const edu of education) {
    const d = (edu.degree ?? '').toLowerCase();
    if (/ph\.?d|doctor/i.test(d)) best = Math.max(best, 100);
    else if (/master|m\.?s\.?|m\.?a\.?|mba|m\.?eng|m\.?tech|m\.?sc/i.test(d)) best = Math.max(best, 90);
    else if (/bachelor|b\.?s\.?|b\.?a\.?|b\.?eng|b\.?tech|b\.?sc/i.test(d)) best = Math.max(best, 80);
    else if (/associate|a\.?s\.?/i.test(d)) best = Math.max(best, 68);
    else if (/diploma|high\s+school|ged/i.test(d)) best = Math.max(best, 52);
  }
  return best;
}

/** Score certifications against the job role text. */
function scoreCertifications(
  certifications: Array<{ name: string }> | undefined,
  jobRole: string,
): number {
  if (!certifications?.length) return 50;
  const jdLower = jobRole.toLowerCase();
  let score = 55;
  for (const cert of certifications) {
    const certLower = cert.name.toLowerCase();
    // Relevant if any word from the cert name appears in the job description
    const words = certLower.split(/\s+/).filter((w) => w.length > 3);
    if (words.some((w) => jdLower.includes(w))) {
      score = Math.min(100, score + 15);
    } else {
      score = Math.min(100, score + 5);
    }
  }
  return score;
}

/** Normalise criteria weights object and return fractional weights summing to 1. */
function normalizeCriteriaWeights(weights?: {
  skills?: number | null;
  experience?: number | null;
  education?: number | null;
  certifications?: number | null;
}) {
  const s = Math.max(0, weights?.skills ?? 40);
  const e = Math.max(0, weights?.experience ?? 30);
  const ed = Math.max(0, weights?.education ?? 20);
  const c = Math.max(0, weights?.certifications ?? 10);
  const total = s + e + ed + c || 100;
  return { skills: s / total, experience: e / total, education: ed / total, certifications: c / total };
}

/** Prefer a plausible human name line near the top (not URLs, addresses, section headers). */
function extractNameFromLines(text: string): { firstName: string; lastName: string } | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 45);
  for (const line of lines) {
    if (line.length < 4 || line.length > 72) continue;
    if (/@|http|www\.|linkedin|github|phone|tel:|email|curriculum|vitae|^\s*resume\s*$/i.test(line)) continue;
    if (/^\d+[\d\s,]+(Street|Road|Lane|Avenue|Drive|Close|Way)\b/i.test(line)) continue;
    const m = line.match(/^([A-Z][a-zA-Z''-]+)\s+([A-Z][a-zA-Z''-]+(?:\s+[A-Z][a-zA-Z''-]+){0,2})$/);
    if (m) return { firstName: m[1], lastName: m[2] };
  }
  return null;
}

function extractLocationLine(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const uk =
    lines.find((line) =>
      /\d+[\s,]+[\w\s.''-]+(?:Street|Road|Lane|Avenue|Drive|Close|Way)\b.*(?:UK|United Kingdom|England|Scotland|Wales)/i.test(
        line,
      ),
    ) ?? null;
  if (uk) return uk;
  return lines.find((line) => /(remote|, [A-Z]{2}$|united states|philippines|singapore)/i.test(line)) ?? null;
}

function extractPrimaryJobTitle(text: string): string | null {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (const line of lines) {
    if (line.length < 8 || line.length > 140) continue;
    if (/^(skills|education|experience|employment|work history|projects|references)/i.test(line)) continue;
    if (
      /\b(developer|engineer|manager|analyst|consultant|designer|architect|specialist|director|scientist|intern|coordinator|administrator)\b/i.test(
        line,
      )
    ) {
      return line.replace(/^[-•*\s]+/, '').slice(0, 120);
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Section parsing
// ---------------------------------------------------------------------------

type ParsedEducationRow = { institution: string; degree: string; year: number | null };
type ParsedProjectRow = { name: string; description: string; url: string | null };

function normalizeResumeSectionHeader(line: string): string | null {
  const l = line.trim();
  if (l.length > 88) return null;
  if (/^(education|academic\s+background|qualifications)\s*:?\s*$/i.test(l)) return 'education';
  if (/^(experience|work\s+experience|employment|work\s+history|professional\s+experience)\s*:?\s*$/i.test(l))
    return 'experience';
  if (/^(projects?|project\s+experience|key\s+projects|portfolio|selected\s+projects)\s*:?\s*$/i.test(l))
    return 'projects';
  if (/^(achievements?|awards?|honors?|accomplishments|certifications?|publications?)\s*:?\s*$/i.test(l))
    return 'achievements';
  return null;
}

function splitResumeSections(fullText: string): Record<string, string> {
  const lines = fullText.split(/\r?\n/);
  const buckets: Record<string, string[]> = {};
  let cur: string | null = null;
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (/^[-_=]{4,}\s*$/.test(trimmed)) continue;
    const key = normalizeResumeSectionHeader(trimmed);
    if (key) {
      cur = key;
      continue;
    }
    if (cur) {
      if (!buckets[cur]) buckets[cur] = [];
      buckets[cur].push(raw);
    }
  }
  return Object.fromEntries(Object.entries(buckets).map(([k, arr]) => [k, arr.join('\n').trim()]));
}

function parseEducationSection(section: string): ParsedEducationRow[] {
  const entries: ParsedEducationRow[] = [];
  const rawLines = section
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let line of rawLines) {
    line = line.replace(/^[•\-*◦‣]\s*/, '').replace(/^\d+[.)]\s*/, '');
    if (line.length < 4) continue;
    const years = line.match(/\b(19|20)\d{2}\b/g);
    const year = years?.length ? parseInt(years[years.length - 1]!, 10) : null;
    let institution = '';
    let degree = '';
    if (/\s[|｜]\s|\s[—–]\s/.test(line)) {
      const parts = line
        .split(/\s*[|｜]\s*|\s[—–]\s/)
        .map((p) => p.trim())
        .filter(Boolean);
      if (parts.length >= 2) {
        degree = parts[0].replace(/\s*\(?\d{4}\)?\s*$/u, '').trim();
        institution = parts
          .slice(1)
          .join(' · ')
          .replace(/\s*\(?\d{4}\)?\s*$/u, '')
          .trim();
      }
    } else if (line.includes(',')) {
      const commaParts = line
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);
      if (commaParts.length >= 2) {
        degree = commaParts[0];
        institution = commaParts
          .slice(1)
          .join(', ')
          .replace(/\b(19|20)\d{2}\b/g, '')
          .trim();
      }
    } else {
      degree = line.replace(/\b(19|20)\d{2}\b/g, '').trim();
      institution = 'See resume';
    }
    if (degree || institution) {
      entries.push({ institution: institution || 'See resume', degree: degree || 'See resume', year });
    }
  }
  return entries;
}

function extractLooseEducationLines(fullText: string): ParsedEducationRow[] {
  const lines = fullText
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const hits: string[] = [];
  for (const line of lines) {
    if (line.length > 220) continue;
    if (
      /\b(University|College|Institute|Polytechnic|School\s+of)\b/i.test(line) ||
      /\b(Bachelor|B\.?S\.?|B\.?A\.?|Master|M\.?S\.?|M\.?A\.?|MBA|Ph\.?D\.?|Associate)\b/i.test(line)
    ) {
      hits.push(line.replace(/^[•\-*◦‣]\s*/, '').replace(/^\d+[.)]\s*/, ''));
    }
  }
  const dedup = [...new Set(hits)];
  return dedup.length ? parseEducationSection(dedup.join('\n')) : [];
}

function parseAchievementsSection(section: string): string[] {
  const out: string[] = [];
  const lines = section
    .split(/\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  for (let line of lines) {
    line = line
      .replace(/^[•\-*◦‣]\s*/, '')
      .replace(/^\d+[.)]\s*/, '')
      .trim();
    if (line.length > 2 && line.length < 600) out.push(line);
    if (out.length >= 45) break;
  }
  return out;
}

function parseProjectsSection(section: string): ParsedProjectRow[] {
  const projects: ParsedProjectRow[] = [];
  const paras = section
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paras.length > 1) {
    for (const para of paras) {
      const lines = para
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) continue;
      const urlMatch = para.match(/https?:\/\/[^\s)]+/);
      const name = lines[0].slice(0, 160);
      const description = lines.slice(1).join('\n').trim() || name;
      projects.push({ name, description: description.slice(0, 2500), url: urlMatch?.[0] ?? null });
      if (projects.length >= 22) break;
    }
  }
  if (!projects.length) {
    const chunks = section.split(/\n(?=\s*[•\-*◦‣]|\s*\d+[.)])/);
    for (const chunk of chunks) {
      const cleaned = chunk.replace(/^[•\-*◦‣\s]+|^\s*\d+[.)]\s*/m, '').trim();
      if (cleaned.length < 4) continue;
      const urlMatch = cleaned.match(/https?:\/\/[^\s)]+/);
      const lines = cleaned
        .split(/\n/)
        .map((l) => l.trim())
        .filter(Boolean);
      const name = (lines[0] ?? cleaned).slice(0, 160);
      const description = lines.slice(1).join('\n').trim() || name;
      projects.push({ name, description: description.slice(0, 2500), url: urlMatch?.[0] ?? null });
      if (projects.length >= 22) break;
    }
  }
  return projects;
}

type ExperienceRow = {
  company: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  duration: string | null;
};

/** Parse experience entries from the experience section with duration extraction. */
function parseExperienceSection(section: string): ExperienceRow[] {
  const entries: ExperienceRow[] = [];
  // Split on blank lines or bullet-prefixed lines indicating new roles
  const blocks = section.split(/\n{2,}/).map((b) => b.trim()).filter(Boolean);

  for (const block of blocks) {
    const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
    if (!lines.length) continue;

    const datePattern = /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s+\d{4}|\b\d{4}\b/gi;
    const dates = block.match(datePattern) ?? [];
    const isCurrent = /\b(present|current|now)\b/i.test(block);
    const startDate = dates[0] ?? null;
    const endDate = isCurrent ? null : (dates[1] ?? null);

    // Try to identify company and title from first two non-date lines
    const cleanLines = lines.map((l) => l.replace(datePattern, '').replace(/[-–—]\s*$/,'').trim()).filter(Boolean);
    const title = cleanLines[0] ?? 'Not specified';
    const company = cleanLines[1] ?? 'Not specified';

    let duration: string | null = null;
    if (startDate && endDate) duration = `${startDate} – ${endDate}`;
    else if (startDate && isCurrent) duration = `${startDate} – Present`;

    entries.push({ company, title, startDate, endDate, current: isCurrent, duration });
    if (entries.length >= 12) break;
  }

  return entries;
}

// ---------------------------------------------------------------------------
// Main parser
// ---------------------------------------------------------------------------

function parseResumeText(text: string) {
  const startedAt = Date.now();
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  const firstLine = lines[0] ?? 'Unknown Candidate';
  const [flFirst = 'Unknown', ...flRest] = firstLine.split(/\s+/);
  const named = extractNameFromLines(text);
  const firstName = named?.firstName ?? flFirst;
  const lastName = named?.lastName ?? (flRest.join(' ') || 'Candidate');

  const skills = extractSkills(text);
  const totalYearsExperience = extractTotalYearsExperience(text);

  // Experience level from years first, then keyword signals
  let experienceLevel: string;
  if (totalYearsExperience !== null) {
    experienceLevel = totalYearsExperience >= 8 ? 'Senior' : totalYearsExperience >= 3 ? 'Mid' : 'Junior';
  } else {
    const hasSeniorSignals = /(senior|lead|principal|staff|8\+?\s*years|10\+?\s*years)/i.test(text);
    const hasMidSignals = /(mid|intermediate|3\+?\s*years|4\+?\s*years|5\+?\s*years|6\s*years)/i.test(text);
    experienceLevel = hasSeniorSignals ? 'Senior' : hasMidSignals ? 'Mid' : 'Junior';
  }

  const location = extractLocationLine(text);
  const titleFromText =
    extractPrimaryJobTitle(text) ?? (experienceLevel === 'Senior' ? 'Senior Professional' : 'Professional');

  const sections = splitResumeSections(text);

  let educationList = sections.education ? parseEducationSection(sections.education) : [];
  if (!educationList.length) educationList = extractLooseEducationLines(text);
  if (!educationList.length) educationList = [{ institution: 'Not specified', degree: 'Not specified', year: null }];

  let experienceList = sections.experience ? parseExperienceSection(sections.experience) : [];
  if (!experienceList.length) {
    experienceList = [
      { company: 'Not specified', title: titleFromText, startDate: null, endDate: null, current: true, duration: null },
    ];
  }

  const achievements = sections.achievements ? parseAchievementsSection(sections.achievements) : [];
  const projects = sections.projects ? parseProjectsSection(sections.projects) : [];
  const certifications = extractCertifications(text);
  const languages = extractLanguages(text);

  const confidenceScore =
    skills.length >= 5 ? 0.92 : skills.length >= 2 ? 0.80 : named ? 0.72 : 0.58;

  return {
    personalInfo: {
      firstName,
      lastName,
      email: extractEmail(text),
      phone: extractPhone(text),
      location,
      linkedin: extractLinkedin(text),
      github: extractGithub(text),
      portfolio: extractPortfolio(text),
    },
    skills,
    techStack: skills.slice(0, 8),
    experienceLevel,
    education: educationList,
    experience: experienceList,
    achievements,
    projects,
    certifications,
    languages,
    totalYearsExperience,
    meta: {
      confidenceScore,
      processingTimeMs: Date.now() - startedAt,
    },
  };
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

type ParsedResumeData = ReturnType<typeof parseResumeText>;

function scoreResume(
  jobRole: string,
  parsed: ParsedResumeData,
  resumePlainText = '',
  criteriaWeights?: {
    skills?: number | null;
    experience?: number | null;
    education?: number | null;
    certifications?: number | null;
  },
) {
  const w = normalizeCriteriaWeights(criteriaWeights);

  // --- 1. Technical skills ---
  const jdSkills = extractSkills(jobRole).map((s) => s.toLowerCase());
  const candidateSkillsLower = parsed.skills.map((s) => s.toLowerCase());
  const candidateSkillSet = new Set(candidateSkillsLower);
  const matched = parsed.skills.filter((s) => jdSkills.includes(s.toLowerCase()));

  const requirementKeywords = extractMeaningKeywords(jobRole);
  const resumeKeywords = extractMeaningKeywords(
    [
      resumePlainText,
      parsed.skills.join(' '),
      parsed.techStack.join(' '),
      parsed.experience.map((e) => `${e.title} ${e.company}`).join(' '),
      parsed.education.map((e) => `${e.institution} ${e.degree}`).join(' '),
      parsed.achievements.join(' '),
      parsed.projects.map((p) => `${p.name} ${p.description}`).join(' '),
    ].join('\n'),
  );
  const keywordMatches = [...requirementKeywords].filter((kw) => resumeKeywords.has(kw)).length;
  const keywordCoverage = requirementKeywords.size ? keywordMatches / requirementKeywords.size : 0.5;
  const skillCoverage = jdSkills.length ? matched.length / jdSkills.length : 0.55;
  const technicalSkills = Math.round((skillCoverage * 0.75 + keywordCoverage * 0.25) * 100);

  // --- 2. Experience ---
  let experienceScore: number;
  const yrs = parsed.totalYearsExperience;
  if (yrs !== null && yrs !== undefined) {
    if (yrs >= 10) experienceScore = 100;
    else if (yrs >= 7) experienceScore = 90;
    else if (yrs >= 5) experienceScore = 80;
    else if (yrs >= 3) experienceScore = 70;
    else if (yrs >= 1) experienceScore = 60;
    else experienceScore = 50;
  } else {
    experienceScore = parsed.experienceLevel === 'Senior' ? 90 : parsed.experienceLevel === 'Mid' ? 75 : 60;
  }

  // --- 3. Education ---
  const educationScore = scoreEducation(parsed.education);

  // --- 4. Certifications ---
  const certificationScore = scoreCertifications(parsed.certifications, jobRole);

  // --- 5. Domain knowledge (secondary blend) ---
  const domainKnowledge = Math.max(50, Math.min(100, Math.round((technicalSkills + experienceScore) / 2)));

  // --- Weighted final score ---
  const matchScore = Math.min(
    100,
    Math.max(
      0,
      Math.round(
        technicalSkills * w.skills +
          experienceScore * w.experience +
          educationScore * w.education +
          certificationScore * w.certifications,
      ),
    ),
  );

  return { technicalSkills, experienceLevel: experienceScore, domainKnowledge, educationScore, certificationScore, matchScore, matched };
}

function buildRankingSummary(
  jobRole: string,
  parsed: ParsedResumeData,
  score: ReturnType<typeof scoreResume>,
): string {
  const jdSkills = extractSkills(jobRole).map((s) => s.toLowerCase());
  const candidateSet = new Set(parsed.skills.map((s) => s.toLowerCase()));
  const gaps = jdSkills.filter((s) => !candidateSet.has(s));

  const lines: string[] = [];
  lines.push(
    `Overall match: ${score.matchScore}% — skills ${score.technicalSkills}/100, experience ${score.experienceLevel}/100, education ${score.educationScore}/100, certifications ${score.certificationScore}/100.`,
  );
  if (score.matched.length) {
    lines.push(
      `Matching skills: ${score.matched.slice(0, 14).join(', ')}${score.matched.length > 14 ? '…' : ''}.`,
    );
  } else if (jdSkills.length) {
    lines.push('No direct skill overlap detected between the job description and this resume.');
  }
  if (gaps.length && jdSkills.length) {
    lines.push(`Skills gap: ${gaps.slice(0, 10).join(', ')}${gaps.length > 10 ? '…' : ''}.`);
  }
  return lines.join('\n\n');
}

// ---------------------------------------------------------------------------
// Auth & utility helpers
// ---------------------------------------------------------------------------

type ResolverContext = { token: string | null };

function stripDataUrlBase64(input: string) {
  return input.replace(/^data:[^;]+;base64,/, '');
}

async function extractPdfText(pdfBase64: string) {
  const buffer = Buffer.from(stripDataUrlBase64(pdfBase64), 'base64');
  const pdfParseModule = await import('pdf-parse');
  const parser = new pdfParseModule.PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    return (result.text ?? '').trim();
  } finally {
    await parser.destroy();
  }
}

async function extractDocxText(docxBase64: string) {
  const buffer = Buffer.from(stripDataUrlBase64(docxBase64), 'base64');
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return (result.value ?? '').trim();
}

function isDocxMime(mimeType: string, fileName?: string) {
  const m = mimeType.toLowerCase();
  if (m.includes('wordprocessingml.document') || m.includes('officedocument.wordprocessingml')) return true;
  if (fileName?.toLowerCase().endsWith('.docx')) return true;
  return false;
}

function hashPassword(password: string, salt: string) {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function generateToken() {
  return crypto.randomBytes(32).toString('hex');
}

function sanitizeUser(user: { _id: unknown; email: string; firstName: string; lastName: string }) {
  return { id: String(user._id), email: user.email, firstName: user.firstName, lastName: user.lastName };
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
  criteriaWeights?: { skills?: number; experience?: number; education?: number; certifications?: number } | null;
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
    criteriaWeights: job.criteriaWeights
      ? {
          skills: job.criteriaWeights.skills ?? 40,
          experience: job.criteriaWeights.experience ?? 30,
          education: job.criteriaWeights.education ?? 20,
          certifications: job.criteriaWeights.certifications ?? 10,
        }
      : { skills: 40, experience: 30, education: 20, certifications: 10 },
    rankedResumes: (job.rankedResumes ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      title: r.title ?? null,
      location: r.location ?? null,
      skills: r.skills ?? [],
      experienceLevel: r.experienceLevel,
      matchScore: r.matchScore,
      summary: r.summary ?? null,
      rankedAt: (r.rankedAt ?? new Date()).toISOString(),
    })),
    createdAt: (job.createdAt ?? new Date()).toISOString(),
  };
}

async function getAuthedUser(token: string | null) {
  if (!token) return null;
  return UserProfileModel.findOne({ sessionToken: token, sessionExpiresAt: { $gt: new Date() } });
}

// ---------------------------------------------------------------------------
// Resolvers
// ---------------------------------------------------------------------------

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
      return rows.map((r) => sanitizeSavedJob(r as unknown as Parameters<typeof sanitizeSavedJob>[0]));
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
      context: ResolverContext,
    ) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      const incomingHash = input.fileHash.trim();
      if (!incomingHash) throw new Error('Unable to fingerprint resume file.');
      const existing = await UploadedResumeModel.findOne({ userId: user._id, fileHash: incomingHash }).lean();
      if (existing) throw new Error('This resume was already scanned.');
      const saved = await UploadedResumeModel.create({
        userId: user._id,
        fileName: input.fileName,
        mimeType: input.mimeType,
        uri: input.uri,
        fileHash: incomingHash,
      });
      return { id: String(saved._id), fileName: saved.fileName, mimeType: saved.mimeType };
    },

    parseResume: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          resumeId?: string | null;
          text: string;
          fileName?: string;
          pdfBase64?: string;
          mimeType?: string;
        };
      },
      context: ResolverContext,
    ) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      let source = input.text.trim();
      const mime = (input.mimeType ?? '').toLowerCase();
      const isPdf = mime === 'application/pdf';
      const isDocx = isDocxMime(input.mimeType ?? '', input.fileName);
      if (!source && input.pdfBase64) {
        if (isPdf) {
          source = await extractPdfText(input.pdfBase64);
        } else if (isDocx) {
          try {
            source = await extractDocxText(input.pdfBase64);
          } catch (e) {
            throw new Error(e instanceof Error ? e.message : 'Failed to read DOCX file.');
          }
        }
      }
      const parsed = parseResumeText(source.length ? source : input.fileName ?? 'Unknown Candidate');

      const resumeId = input.resumeId?.trim();
      let updated = null;
      if (resumeId && mongoose.Types.ObjectId.isValid(resumeId)) {
        updated = await UploadedResumeModel.findOneAndUpdate(
          { _id: resumeId, userId: user._id },
          { $set: { parsed, rawText: source } },
          { new: true },
        );
      } else if (input.fileName) {
        updated = await UploadedResumeModel.findOneAndUpdate(
          { fileName: input.fileName, userId: user._id },
          { $set: { parsed, rawText: source } },
          { sort: { createdAt: -1 } },
        );
      }

      if (!updated && (resumeId || input.fileName)) {
        throw new Error(
          'Could not attach parse results to this upload. Try signing in again or re-upload the file.',
        );
      }
      return parsed;
    },

    parseResumeFile: async (
      _: unknown,
      { input }: { input: { fileBase64: string; fileName: string; mimeType: string } },
    ) => {
      return parseResumeViaPythonService(input);
    },

    getEmbeddings: (_: unknown, { input }: { input: { payload: string } }) => {
      const tokens = input.payload.toLowerCase().split(/[^a-z0-9+.#]+/i).filter(Boolean);
      const unique = new Set(tokens);
      return JSON.stringify({
        dims: 384,
        tokenCount: tokens.length,
        uniqueTokenCount: unique.size,
        checksum: [...unique].slice(0, 12).join('|'),
      });
    },

    rankCandidates: async (
      _: unknown,
      {
        input,
      }: {
        input: {
          jobRole: string;
          criteriaWeights?: {
            skills?: number | null;
            experience?: number | null;
            education?: number | null;
            certifications?: number | null;
          } | null;
        };
      },
      context: ResolverContext,
    ) => {
      const user = await getAuthedUser(context.token);
      if (!user) throw new Error('Unauthorized');
      const resumes = await UploadedResumeModel.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      const candidates = resumes.map((resume) => {
        const raw = typeof resume.rawText === 'string' ? resume.rawText : '';
        const parsed =
          (resume.parsed as ParsedResumeData | undefined) ??
          parseResumeText(raw.length ? raw : resume.fileName);
        const score = scoreResume(input.jobRole, parsed, raw, input.criteriaWeights ?? undefined);
        const name = `${parsed.personalInfo.firstName} ${parsed.personalInfo.lastName}`.trim();
        return {
          id: String(resume._id),
          name,
          title: parsed.experience[0]?.title ?? 'Candidate',
          location: parsed.personalInfo.location ?? null,
          // Contact info is always returned regardless of user preferences
          email: parsed.personalInfo.email ?? null,
          phone: parsed.personalInfo.phone ?? null,
          linkedin: parsed.personalInfo.linkedin ?? null,
          github: parsed.personalInfo.github ?? null,
          portfolio: parsed.personalInfo.portfolio ?? null,
          skills: parsed.skills,
          experienceLevel: parsed.experienceLevel,
          totalYearsExperience: parsed.totalYearsExperience ?? null,
          matchScore: score.matchScore,
          initials:
            `${parsed.personalInfo.firstName[0] ?? ''}${parsed.personalInfo.lastName[0] ?? ''}`.toUpperCase(),
          summary: buildRankingSummary(input.jobRole, parsed, score),
          breakdown: {
            technicalSkills: score.technicalSkills,
            experienceLevel: score.experienceLevel,
            domainKnowledge: score.domainKnowledge,
            educationScore: score.educationScore,
            certificationScore: score.certificationScore,
          },
          skillAnalysis: parsed.skills.slice(0, 8).map((skill: string) => ({
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
      { input }: { input: { email: string; password: string; firstName: string; lastName: string } },
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
          criteriaWeights?: {
            skills?: number | null;
            experience?: number | null;
            education?: number | null;
            certifications?: number | null;
          } | null;
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
        criteriaWeights: {
          skills: input.criteriaWeights?.skills ?? 40,
          experience: input.criteriaWeights?.experience ?? 30,
          education: input.criteriaWeights?.education ?? 20,
          certifications: input.criteriaWeights?.certifications ?? 10,
        },
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
        .map((r) => ({
          id: String(r.id),
          name: r.name.trim(),
          title: r.title?.trim() || null,
          location: r.location?.trim() || null,
          skills: r.skills.map((s) => s.trim()).filter(Boolean),
          experienceLevel: r.experienceLevel.trim(),
          matchScore: Math.max(0, r.matchScore),
          summary: r.summary?.trim() || null,
          rankedAt: new Date(),
        }))
        .sort((a, b) => b.matchScore - a.matchScore);

      const updated = await SavedJobAnalysisModel.findOneAndUpdate(
        { _id: input.jobId, userId: user._id },
        { $set: { rankedResumes: normalized, rankedCandidateCount: normalized.length } },
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
