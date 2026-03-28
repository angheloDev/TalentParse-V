import type { ParsedResume, RankedCandidate } from '@/types';

export type UploadFileInput = {
  uri: string;
  name: string;
  mimeType: string;
};

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

const mockParsed = (fileHint: string): ParsedResume => ({
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
  },
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'SQL'],
  techStack: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
  experienceLevel: 'Senior',
  education: [
    {
      institution: 'University of California, Berkeley',
      degree: 'B.S. Computer Science',
      year: 2016,
    },
  ],
  experience: [
    {
      company: 'Tech Solutions Inc.',
      title: 'Senior Software Engineer',
      startDate: '2020-03',
      endDate: null,
      current: true,
    },
  ],
  meta: { confidenceScore: 0.96, processingTimeMs: 1240 },
});

const mockRanked = (jobDescription: string): RankedCandidate[] => {
  const seed = jobDescription.length % 5;
  const base: RankedCandidate[] = [
    {
      id: '1',
      name: 'Sarah Jenkins',
      title: 'Senior Product Manager',
      location: 'Seattle, WA',
      skills: ['Agile', 'Scrum', 'Roadmapping', 'Stakeholder Management'],
      experienceLevel: 'Senior',
      matchScore: 95 - seed,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuAahzvel_YUd3PyfueAZtappMzP49xebwne1jwoBEfdn802tHLCmXq1TQrrHtOZ8hYcDgDFzIYh_sdzLbyGDRk07iACtekpDWkjXd5FTqgRQDY4HLlN8VHLG2B1Oxp3NNcALIxhEONl3cyTHE9PnxWtaUEULrYc70azrrR8Fm92T3s4BxwZYD6V2jYpnVm1jeKMgk58S6670ecjwx_FbewzwdDtFjd8tClaAEKaKi_ocDEY55oZ7krToBy0Q99FSp3X4B91Vyft_azf',
      summary:
        'Highly qualified candidate with strong product leadership and delivery track record.',
      breakdown: { technicalSkills: 38, experienceLevel: 32, domainKnowledge: 25 },
      skillAnalysis: [
        { name: 'Python', level: 'Expert (5+ yrs)', percent: 95 },
        { name: 'PyTorch', level: 'Advanced (3 yrs)', percent: 85 },
        { name: 'AWS / MLOps', level: 'Advanced (4 yrs)', percent: 80 },
        { name: 'C++', level: 'Intermediate (2 yrs)', percent: 60 },
      ],
      keywords: ['NLP', 'Transformers', 'Docker', 'Kubernetes', 'CI/CD', 'REST APIs'],
      experienceSummary: [
        { title: 'Senior ML Engineer', company: 'TechCorp Innovations', period: '2020 - Present' },
        { title: 'Data Scientist', company: 'DataFlow Analytics', period: '2017 - 2020' },
      ],
    },
    {
      id: '2',
      name: 'Michael Chen',
      title: 'Product Owner',
      location: 'Remote',
      skills: ['Agile', 'User Stories', 'Backlog', 'Jira'],
      experienceLevel: 'Mid',
      matchScore: 88 - seed,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuBWtc9sIBXqGyI98OtzgghXUqQwDQB3KLc36Znk_xdtDnhDbjWFQKzNlfy5IkgeJzcvZw16A5rBLrfHNjKP726AVu0vS9RLFl54MQin4v12yU4KTvqIWrgiDyMj5cWhJLafpSXXXRkr_MMPhxsM1i_LV823u2Z5R9uaT-q33Z0qhpQgqH_yc-0ivzWg1zZY_QvdoX7TL1BuUbsyKIU4IYKZNouyCCyY_1dui4NbkpvTmYKidHN-Zt7K4EllplR7lzdMVPmJbefVOXWH',
    },
    {
      id: '3',
      name: 'Elena Rodriguez',
      title: 'Technical PM',
      location: 'Austin, TX',
      skills: ['Scrum', 'API Design', 'SQL', 'Documentation'],
      experienceLevel: 'Senior',
      matchScore: 82 - seed,
      initials: 'ER',
    },
    {
      id: '4',
      name: 'David Kim',
      title: 'Associate Product Manager',
      location: 'Remote',
      skills: ['Data Analysis', 'QA', 'Excel', 'SQL'],
      experienceLevel: 'Junior',
      matchScore: 71 - seed,
      avatarUrl:
        'https://lh3.googleusercontent.com/aida-public/AB6AXuD96-0_gBjKZ6wmBsVN8cGNOnBjKZ2jEXZHPrJkM82gGb0naarDgmATuDpN9f26IpRCnMyy1OXGUcmcjUcBudKt9ifgY81wLrq67WO9Sz8NdCAfj9jYTOM7zXvMBOZc6r1kvqXCeZv888UURXHEjKHl_i4LXAQQmpp0Hll0VZ2dEAtSdw5-wvPkXlEvAZw7OQhp9n0exmJkZCf9y24hmKhJrGZSPuZDdeW_3DxXhQ9mQpR4dwTUczEzFhxBS_19IKPQKW0uhJ0cB3M7',
    },
  ];
  return base.sort((a, b) => b.matchScore - a.matchScore);
};

export async function uploadResume(file: UploadFileInput) {
  await delay(500 + Math.random() * 400);
  return {
    id: `up_${Date.now()}`,
    fileName: file.name,
    mimeType: file.mimeType,
  };
}

export async function parseResume(text: string, fileNameHint?: string) {
  await delay(800 + Math.random() * 600);
  const hint = fileNameHint ?? text.slice(0, 24);
  return mockParsed(hint);
}

export async function getEmbeddings(data: Record<string, unknown>) {
  await delay(350);
  return JSON.stringify({ dims: 384, sample: Object.keys(data).length });
}

export async function rankCandidates(jobDescription: string) {
  await delay(700 + Math.random() * 500);
  if (!jobDescription.trim()) throw new Error('Job description is required');
  return mockRanked(jobDescription);
}
