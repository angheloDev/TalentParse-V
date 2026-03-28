import { randomUUID } from 'node:crypto';

const userProfiles = new Map<
  string,
  { id: string; clerkUserId: string; username: string; email: string }
>();

const mockParsed = () => ({
  personalInfo: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1 (555) 123-4567',
    location: 'San Francisco, CA',
  },
  skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'SQL'],
  techStack: ['React', 'TypeScript', 'Node.js', 'GraphQL'],
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
      duration: '2020 - Present',
    },
  ],
  meta: { confidenceScore: 0.96, processingTimeMs: 1240 },
});

const mockRanked = () => [
  {
    id: '1',
    name: 'Sarah Jenkins',
    title: 'Senior Product Manager',
    location: 'Seattle, WA',
    skills: ['Agile', 'Scrum', 'Roadmap'],
    experienceLevel: 'Senior',
    matchScore: 95,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuAahzvel_YUd3PyfueAZtappMzP49xebwne1jwoBEfdn802tHLCmXq1TQrrHtOZ8hYcDgDFzIYh_sdzLbyGDRk07iACtekpDWkjXd5FTqgRQDY4HLlN8VHLG2B1Oxp3NNcALIxhEONl3cyTHE9PnxWtaUEULrYc70azrrR8Fm92T3s4BxwZYD6V2jYpnVm1jeKMgk58S6670ecjwx_FbewzwdDtFjd8tClaAEKaKi_ocDEY55oZ7krToBy0Q99FSp3X4B91Vyft_azf',
    summary:
      'Highly qualified candidate with extensive product experience. Strong alignment with Agile delivery and roadmap ownership.',
    breakdown: { technicalSkills: 96, experienceLevel: 94, domainKnowledge: 93 },
    skillAnalysis: [
      { name: 'Agile', level: 'Expert (8+ yrs)', percent: 95 },
      { name: 'Scrum', level: 'Advanced', percent: 90 },
      { name: 'Analytics', level: 'Advanced', percent: 88 },
    ],
    keywords: ['Agile', 'Scrum', 'Roadmap', 'Stakeholders'],
    experienceSummary: [
      {
        title: 'Senior Product Manager',
        company: 'Northwind',
        period: '2020 - Present',
        bullets: ['Owned roadmap for core platform.', 'Led cross-functional squads.'],
      },
    ],
  },
  {
    id: '2',
    name: 'Michael Chen',
    title: 'Product Owner',
    location: 'Austin, TX',
    skills: ['Agile', 'User Stories', 'Backlog'],
    experienceLevel: 'Mid',
    matchScore: 88,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuBWtc9sIBXqGyI98OtzgghXUqQwDQB3KLc36Znk_xdtDnhDbjWFQKzNlfy5IkgeJzcvZw16A5rBLrfHNjKP726AVu0vS9RLFl54MQin4v12yU4KTvqIWrgiDyMj5cWhJLafpSXXXRkr_MMPhxsM1i_LV823u2Z5R9uaT-q33Z0qhpQgqH_yc-0ivzWg1zZY_QvdoX7TL1BuUbsyKIU4IYKZNouyCCyY_1dui4NbkpvTmYKidHN-Zt7K4EllplR7lzdMVPmJbefVOXWH',
    summary: 'Strong backlog ownership and stakeholder communication.',
    breakdown: { technicalSkills: 86, experienceLevel: 88, domainKnowledge: 87 },
    skillAnalysis: [
      { name: 'User Stories', level: 'Advanced', percent: 88 },
      { name: 'Agile', level: 'Advanced', percent: 85 },
    ],
    keywords: ['Agile', 'User Stories', 'Jira'],
    experienceSummary: [
      {
        title: 'Product Owner',
        company: 'Contoso',
        period: '2019 - Present',
        bullets: ['Refined backlog for two teams.'],
      },
    ],
  },
  {
    id: '3',
    name: 'Elena Rodriguez',
    title: 'Technical PM',
    location: 'San Francisco, CA',
    skills: ['Scrum', 'API Design'],
    experienceLevel: 'Senior',
    matchScore: 82,
    initials: 'ER',
    summary: 'Technical PM with API and platform background.',
    breakdown: { technicalSkills: 88, experienceLevel: 80, domainKnowledge: 78 },
    skillAnalysis: [
      { name: 'API Design', level: 'Advanced', percent: 86 },
      { name: 'Scrum', level: 'Advanced', percent: 82 },
    ],
    keywords: ['Scrum', 'API Design', 'Platform'],
    experienceSummary: [
      {
        title: 'Technical PM',
        company: 'Fabrikam',
        period: '2018 - Present',
        bullets: ['Partnered with engineering on API contracts.'],
      },
    ],
  },
  {
    id: '4',
    name: 'David Kim',
    title: 'Associate Product Manager',
    location: 'Remote',
    skills: ['Data Analysis', 'QA'],
    experienceLevel: 'Junior',
    matchScore: 71,
    avatarUrl:
      'https://lh3.googleusercontent.com/aida-public/AB6AXuD96-0_gBjKZ6wmBsVN8cGNOnBjKZ2jEXZHPrJkM82gGb0naarDgmATuDpN9f26IpRCnMyy1OXGUcmcjUcBudKt9ifgY81wLrq67WO9Sz8NdCAfj9jYTOM7zXvMBOZc6r1kvqXCeZv888UURXHEjKHl_i4LXAQQmpp0Hll0VZ2dEAtSdw5-wvPkXlEvAZw7OQhp9n0exmJkZCf9y24hmKhJrGZSPuZDdeW_3DxXhQ9mQpR4dwTUczEzFhxBS_19IKPQKW0uhJ0cB3M7',
    summary: 'Growing PM with analytics and QA strengths.',
    breakdown: { technicalSkills: 70, experienceLevel: 72, domainKnowledge: 71 },
    skillAnalysis: [
      { name: 'Data Analysis', level: 'Intermediate', percent: 72 },
      { name: 'QA', level: 'Intermediate', percent: 70 },
    ],
    keywords: ['Data Analysis', 'QA'],
    experienceSummary: [
      {
        title: 'APM',
        company: 'AdventureWorks',
        period: '2022 - Present',
        bullets: ['Supported experimentation reporting.'],
      },
    ],
  },
];

export const resolvers = {
  Query: {
    health: () => 'ok',
  },
  Mutation: {
    uploadResume: (_: unknown, { input }: { input: { fileName: string; mimeType: string } }) => ({
      id: randomUUID(),
      fileName: input.fileName,
      mimeType: input.mimeType,
    }),
    parseResume: (_: unknown, { input }: { input: { text: string } }) => {
      void input.text;
      return mockParsed();
    },
    getEmbeddings: (_: unknown, { input }: { input: { payload: string } }) => {
      void input.payload;
      return 'mock-embedding-vector';
    },
    rankCandidates: (_: unknown, { input }: { input: { jobDescription: string } }) => {
      void input.jobDescription;
      return mockRanked().sort((a, b) => b.matchScore - a.matchScore);
    },
    upsertUserProfile: (
      _: unknown,
      { input }: { input: { clerkUserId: string; username: string; email: string } }
    ) => {
      const existing = userProfiles.get(input.clerkUserId);
      if (existing) {
        const next = {
          ...existing,
          username: input.username,
          email: input.email,
        };
        userProfiles.set(input.clerkUserId, next);
        return next;
      }
      const created = {
        id: randomUUID(),
        clerkUserId: input.clerkUserId,
        username: input.username,
        email: input.email,
      };
      userProfiles.set(input.clerkUserId, created);
      return created;
    },
  },
};
