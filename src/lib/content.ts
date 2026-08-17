export interface TimelineItem {
  id: number;
  phase: string;
  period: string;
  title: string;
  desc: string;
}

export const TIMELINE: TimelineItem[] = [
  {
    id: 1,
    phase: 'Phase 01',
    period: 'Jul 2026',
    title: 'SPOC Registration',
    desc: 'Official Single Point of Contact (SPOC) registration by GL Bajaj Institute on the SIH portal.',
  },
  {
    id: 2,
    phase: 'Phase 02',
    period: 'Jun – Aug 2026',
    title: 'Internal Hackathon',
    desc: 'Campus-wide internal hackathon at GL Bajaj to screen, mentor, and select the top student teams.',
  },
  {
    id: 3,
    phase: 'Phase 03',
    period: 'Jul – Aug 2026',
    title: 'SIH PS Launch',
    desc: 'Official nationwide release of problem statements across 17 ministries and industrial themes.',
  },
  {
    id: 4,
    phase: 'Phase 04',
    period: 'Jul – Aug 2026',
    title: 'Report Upload',
    desc: 'Internal hackathon evaluation reports and top team nomination details uploaded to SIH portal.',
  },
  {
    id: 5,
    phase: 'Phase 05',
    period: 'Aug – Sep 2026',
    title: 'Idea Nomination',
    desc: 'Official submission of executive PPTs, architecture diagrams, and prototype videos on SIH portal.',
  },
  {
    id: 6,
    phase: 'Phase 06',
    period: 'Sep – Oct 2026',
    title: 'Idea Screening',
    desc: 'Rigorous multi-round evaluation of submitted proposals by national jury panels and ministry experts.',
  },
  {
    id: 7,
    phase: 'Phase 07',
    period: 'Oct 2026',
    title: 'Result Publication',
    desc: 'Official publication of shortlisted finalist teams for the Smart India Hackathon Grand Finale.',
  },
  {
    id: 8,
    phase: 'Phase 08',
    period: 'Nov 2026',
    title: 'Finalist Alert',
    desc: 'Dispatch of official finalist letters, nodal center assignments, and logistical instructions.',
  },
  {
    id: 9,
    phase: 'Phase 09',
    period: 'Nov 2026',
    title: 'Training Sessions',
    desc: 'Intensive faculty mentorship, technical bootcamps, and mock presentation drills at GL Bajaj.',
  },
  {
    id: 10,
    phase: 'Phase 10',
    period: 'Nov 2026',
    title: 'Roster Announcement',
    desc: 'Final roster confirmation and travel preparation for teams heading to national nodal centers.',
  },
  {
    id: 11,
    phase: 'Phase 11',
    period: 'Dec 2026',
    title: 'SIH Grand Finale',
    desc: '36-hour non-stop national hackathon finale at assigned nodal centers across India.',
  },
];

export const SIH_MILESTONES = TIMELINE;

export interface ThemeSet {
  id: number;
  title: string;
  themes: { name: string; desc: string }[];
}

export const ALL_17_THEME_SETS: ThemeSet[] = [
  {
    id: 1,
    title: 'Fitness, Space Tech & Heritage',
    themes: [
      { name: 'Fitness & Sports', desc: 'Ideas that can boost fitness activities and assist in keeping fit.' },
      { name: 'Space Technology', desc: 'For use in travel or activities beyond Earth’s atmosphere, for purposes such as spaceflight or space exploration.' },
      { name: 'Heritage & Culture', desc: 'Ideas that showcase the rich cultural heritage and traditions of India.' },
    ],
  },
  {
    id: 2,
    title: 'MedTech, Agriculture & Smart Vehicles',
    themes: [
      { name: 'MedTech / BioTech / HealthTech', desc: 'Cutting-edge technology in these sectors continues to be in demand. Recent shifts in healthcare trends and growing populations present an array of opportunities for innovation.' },
      { name: 'Agriculture, FoodTech & Rural Development', desc: 'Developing solutions that enhance the primary sector of India — agriculture — and help manage and process our agricultural produce.' },
      { name: 'Smart Vehicles', desc: 'Creating intelligent devices to improve the commutation sector.' },
    ],
  },
  {
    id: 3,
    title: 'Logistics, Robotics & Clean Tech',
    themes: [
      { name: 'Transportation & Logistics', desc: 'Ideas that address the growing pressures on the city’s resources, transport networks, and logistic infrastructure.' },
      { name: 'Robotics and Drones', desc: 'Design drones and robots that can solve pressing challenges such as handling medical emergencies and search and rescue operations.' },
      { name: 'Clean & Green Technology', desc: 'Solutions in the form of waste segregation, disposal, and improved sanitisation systems.' },
    ],
  },
  {
    id: 4,
    title: 'Tourism, Energy & Blockchain',
    themes: [
      { name: 'Tourism', desc: 'A solution that can boost the current situation of the tourism industry including hotels, travel, and more.' },
      { name: 'Renewable / Sustainable Energy', desc: 'Innovative ideas that help manage and generate renewable and sustainable sources more efficiently.' },
      { name: 'Blockchain & Cybersecurity', desc: 'Ideas in decentralised and distributed ledger technology used to store digital information, which can radically change multiple sectors.' },
    ],
  },
  {
    id: 5,
    title: 'Smart Education, Disaster Mgmt & Games',
    themes: [
      { name: 'Smart Education', desc: 'Smart education describes learning in the digital age, enabling learners to learn more effectively, efficiently, flexibly, and comfortably.' },
      { name: 'Disaster Management', desc: 'Ideas related to risk mitigation, planning, and management before, during, or after a disaster.' },
      { name: 'Toys & Games', desc: 'Conceptualise and develop unique toys and games based on our civilisation, history, and culture.' },
    ],
  },
  {
    id: 6,
    title: 'Automation & Miscellaneous',
    themes: [
      { name: 'Smart Automation', desc: 'Ideas focused on the intelligent use of resources, combining automation with artificial intelligence to surface valuable insights.' },
      { name: 'Miscellaneous', desc: 'Technology ideas in tertiary sectors like hospitality, entertainment, and retail.' },
    ],
  },
];

export const ALL_THEME_SETS = ALL_17_THEME_SETS;
export const ALL_18_THEME_SETS = ALL_17_THEME_SETS;

export const FAQS = [
  {
    q: 'Who is eligible to participate?',
    a: 'Any currently enrolled student of GL Bajaj Group of Institutions, Mathura can register. Teams of six members are required, with at least one female member as per official SIH guidelines.',
  },
  {
    q: 'How do I find teammates?',
    a: 'Create your profile with your skills, then use Find Teammates to browse students by track and skill set. The platform highlights complementary skills so your team covers every gap.',
  },
  {
    q: 'What does a mentor do?',
    a: 'Faculty mentors guide your problem selection, review your architecture and prototype, and prepare you for jury evaluation. Browse verified mentors and send a request from Find Mentors.',
  },
  {
    q: 'Are the official problem statements out?',
    a: 'Not yet. The official SIH 2026 problem statements are released by the ministries closer to the event. In the meantime, all 17 official themes are configured on the platform so you can pick a direction early.',
  },
  {
    q: 'Can I change my team after registering?',
    a: 'Yes. Team composition can be edited from your dashboard until the internal hackathon submission deadline, after which the roster is locked for evaluation.',
  },
];
