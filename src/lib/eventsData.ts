export interface ArenaEventDetail {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  bannerUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  organizer?: string;
  institution?: string;
  teamSize?: string;
  category?: string;
  registrationDeadline?: string;
  submissionDeadline?: string;
  venue?: string;
  whatsappGroup?: string;
  contacts?: Array<{ label?: string; phone?: string; email?: string }>;
  rounds?: Array<{
    title: string;
    phase: string;
    date: string;
    mode: string;
    description: string;
    highlights?: string[];
  }>;
  domains?: Array<{
    name: string;
    description: string;
  }>;
  perks?: Array<{
    title: string;
    description: string;
    icon?: string;
  }>;
}

export const DEFAULT_ARENA_EVENTS: ArenaEventDetail[] = [
  {
    id: 'evt-hustle-carnival-2026',
    name: 'Hustle Carnival',
    slug: 'hustle-carnival-2026',
    tagline: 'Hustle Beyond · Open Innovation Buildathon',
    description:
      'The flagship hybrid buildathon hosted by Club Ellusion, the official technical club of G.L. Bajaj Group of Institutions, Mathura. Designed around the vision "Hustle Beyond," this open innovation event brings together student coders, designers, and innovators across engineering and management disciplines.',
    bannerUrl: '/events/hustle-carnival.png',
    startDate: '2026-10-22T08:30:00.000Z',
    endDate: '2026-10-24T11:00:00.000Z',
    isActive: true,
    organizer: 'Club Ellusion – Technical Club',
    institution: 'G.L. Bajaj Group of Institutions, Mathura',
    teamSize: '1 – 2 Members',
    category: 'Software Development & Open Innovation',
    registrationDeadline: '22 October 2026, 12:00 PM IST',
    submissionDeadline: '22 October 2026, 2:00 PM IST',
    venue: 'Block A & B, G.L. Bajaj Group of Institutions, Mathura',
    whatsappGroup: 'https://chat.whatsapp.com/Krnr8A2WrXi7CFsAwq1TeH?s=cl&p=a&mlu=4&ilr=4',
    contacts: [
      { label: 'WhatsApp Coordinator 1', phone: '+91 8630322914' },
      { label: 'WhatsApp Coordinator 2', phone: '+91 8393921325' },
      { label: 'WhatsApp Coordinator 3', phone: '+91 9140143828' },
      { label: 'Official Support Email', email: 'ellusion@glbajajgroup.org' },
    ],
    rounds: [
      {
        title: 'Online Video & PPT Submission',
        phase: 'Round 01',
        date: 'Deadline: 22 Oct 2026, 2:00 PM · Results: 23 Oct 2026, 10:00 AM',
        mode: 'Online',
        description:
          'Teams prepare and submit a concise PowerPoint Presentation (PPT) and project demonstration video showcasing their problem, concept, architecture, and expected impact. As an Open Innovation challenge, teams choose their own domain and problem statement.',
        highlights: [
          'Submit final PPT and project video on or before 22 October 2026, 2:00 PM',
          'Showcase your project on LinkedIn with official hashtags: #ellusion #hustlecarnival #glbajajmathura',
          'Top ~35% of participating teams qualify for the on-campus finale',
          'Phase 2 confirmation deadline: 23 October 2026, 11:00 PM',
        ],
      },
      {
        title: 'On-Campus Finale – 6-Hour Buildathon',
        phase: 'Round 02',
        date: '24 October 2026 · 9:20 AM to 4:30 PM',
        mode: 'Offline · Block A & B, GL Bajaj Mathura',
        description:
          'An intensive, high-energy 6-hour on-campus build sprint where shortlisted teams turn their ideas into working, functional prototypes under the guidance of expert mentors and faculty guides.',
        highlights: [
          '6 hours of hands-on coding, prototyping, and testing',
          'Interactive Git & Modern AI Developer Tools Workshop',
          'Dedicated mentor check-ins and architectural review sessions',
          'Live project demonstrations and pitch presentations before an expert judging panel',
        ],
      },
    ],
    domains: [
      { name: 'AI & Machine Learning', description: 'Intelligent automation, LLMs, computer vision, and predictive systems.' },
      { name: 'Full-Stack Web Development', description: 'Responsive web apps, real-time architectures, and SaaS products.' },
      { name: 'Mobile App Development', description: 'Native & cross-platform solutions solving everyday consumer challenges.' },
      { name: 'Fintech & Digital Commerce', description: 'Next-gen payment flows, security protocols, and financial inclusion.' },
      { name: 'Healthcare & MedTech', description: 'Accessible diagnostics, hospital coordination, and patient care.' },
      { name: 'Sustainability & GreenTech', description: 'Energy efficiency, climate tracking, and smart resource distribution.' },
      { name: 'Productivity & Developer Tools', description: 'CLI utilities, engineering workflows, and automation scripts.' },
      { name: 'Open Innovation', description: 'Unbounded creative problem solving in any discipline or vertical.' },
    ],
    perks: [
      {
        title: 'Participant Goodies',
        description: 'Finalists receive customized event merchandise including T-Shirts, stickers, badges, notebooks, and pens.',
      },
      {
        title: 'Recognized Certification',
        description: 'Physical certificates for winners and official e-certificates for all Phase 1 and Phase 2 participants.',
      },
      {
        title: 'Industry Opportunities',
        description: 'Direct networking with industry representatives, mentors, and potential internship opportunities.',
      },
      {
        title: 'Git & AI Tools Workshop',
        description: 'Practical training on Git workflows, collaborative pull requests, and modern AI engineering tools.',
      },
      {
        title: 'Project Showcase',
        description: 'Selected video submissions may be featured on Club Ellusion’s official YouTube channel and platforms.',
      },
    ],
  },
  {
    id: 'evt-sih-internal-2026',
    name: 'SIH Internal 2026',
    slug: 'sih-internal-2026',
    tagline: 'GL Bajaj Smart India Hackathon — Internal Round',
    description:
      'The official internal round of Smart India Hackathon 2026 at GL Bajaj Group of Institutions, Mathura. Form balanced teams, close skill gaps, and match with verified faculty mentors before the national finale.',
    bannerUrl: '/Logo/GL-BAJAJ-LOGO-3.png',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-12-31T00:00:00.000Z',
    isActive: true,
    organizer: 'SIH Committee & Innovation Cell',
    institution: 'G.L. Bajaj Group of Institutions, Mathura',
    teamSize: '6 Members per Team',
    category: 'National Hackathon Qualifier',
    venue: 'Campus Audits & Labs, GL Bajaj Mathura',
  },
];
