/**
 * The 17 official SIH themes.
 *
 * This list is the single source of truth for both the API (`/api/tracks`) and
 * the database seed (`prisma/seed.ts`).
 */
export interface SihTheme {
  id: string;
  problemStatementCode: string;
  name: string;
  organization: string;
  category: string;
  description: string;
  sihUrl: string;
}

export const SIH_OFFICIAL_17_THEMES: SihTheme[] = [
  {
    id: 'sih-theme-1',
    problemStatementCode: 'PS-MEDTECH',
    name: 'MedTech / BioTech / HealthTech',
    organization: 'Ministry of Health and Family Welfare / ICMR',
    category: 'Healthcare & MedTech',
    description: 'Cutting-edge technology in these sectors continues to be in demand. Recent shifts in healthcare trends, growing populations also present an array of opportunities for innovation.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-2',
    problemStatementCode: 'PS-AGRITECH',
    name: 'Agriculture, FoodTech & Rural Development',
    organization: 'Ministry of Agriculture & Farmers Welfare',
    category: 'Agriculture & Rural Development',
    description: 'Developing solutions, keeping in mind the need to enhance the primary sector of India - Agriculture and to manage and process our agriculture produce.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-3',
    problemStatementCode: 'PS-VEHICLES',
    name: 'Smart Vehicles',
    organization: 'Ministry of Road Transport and Highways',
    category: 'Smart Mobility',
    description: 'Creating intelligent devices to improve commutation sector, emergency traffic corridors, and vehicular safety.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-4',
    problemStatementCode: 'PS-LOGISTICS',
    name: 'Transportation & Logistics',
    organization: 'Ministry of Ports, Shipping and Waterways',
    category: 'Logistics & Infrastructure',
    description: 'Submit your ideas to address the growing pressures on the city’s resources, transport networks, and logistic infrastructure.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-5',
    problemStatementCode: 'PS-ROBOTICS',
    name: 'Robotics and Drones',
    organization: 'National Disaster Management Authority (NDMA)',
    category: 'Robotics & Hardware',
    description: 'There is a need to design drones and robots that can solve some of the pressing challenges of India such as handling medical emergencies, search and rescue operations, etc.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-6',
    problemStatementCode: 'PS-CLEANTECH',
    name: 'Clean & Green Technology',
    organization: 'Ministry of Environment, Forest and Climate Change',
    category: 'Environment & Sustainability',
    description: 'Solutions could be in the form of waste segregation, disposal, and improve sanitization system.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-7',
    problemStatementCode: 'PS-TOURISM',
    name: 'Tourism',
    organization: 'Ministry of Tourism',
    category: 'Culture & Hospitality',
    description: 'A solution/idea that can boost the current situation of the tourism industries including hotels, travel and others.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-8',
    problemStatementCode: 'PS-RENEWABLE',
    name: 'Renewable / Sustainable Energy',
    organization: 'Ministry of New and Renewable Energy',
    category: 'Energy & Power',
    description: 'Innovative ideas that help manage and generate renewable /sustainable sources more efficiently.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-9',
    problemStatementCode: 'PS-CYBERSECURITY',
    name: 'Blockchain & Cybersecurity',
    organization: 'Ministry of Electronics & IT (MeitY)',
    category: 'Cybersecurity & FinTech',
    description: 'Provide ideas in a decentralized and distributed ledger technology used to store digital information that powers cryptocurrencies and NFTs and can radically change multiple sectors.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-10',
    problemStatementCode: 'PS-FITNESS',
    name: 'Fitness & Sports',
    organization: 'Ministry of Youth Affairs and Sports',
    category: 'Sports & Well-being',
    description: 'Ideas that can boost fitness activities and assist in keeping fit.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-11',
    problemStatementCode: 'PS-SPACETECH',
    name: 'Space Technology',
    organization: 'Indian Space Research Organisation (ISRO)',
    category: 'Deep Tech & Aerospace',
    description: 'For use in travel or activities beyond Earth’s atmosphere, for purposes such as spaceflight or space exploration.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-12',
    problemStatementCode: 'PS-HERITAGE',
    name: 'Heritage & Culture',
    organization: 'Ministry of Culture',
    category: 'Culture & Preservation',
    description: 'Ideas that showcase the rich cultural heritage and traditions of India.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-13',
    problemStatementCode: 'PS-EDUCATION',
    name: 'Smart Education',
    organization: 'Ministry of Education / AICTE',
    category: 'EdTech & Learning',
    description: 'Smart education, a concept that describes learning in digital age. It enables learners to learn more effectively, efficiently, flexibly and comfortably.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-14',
    problemStatementCode: 'PS-DISASTER',
    name: 'Disaster Management',
    organization: 'Ministry of Home Affairs / NDMA',
    category: 'Safety & Resilience',
    description: 'Disaster management includes ideas related to risk mitigation, Planning and management before, after or during a disaster.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-15',
    problemStatementCode: 'PS-GAMING',
    name: 'Toys & Games',
    organization: 'Ministry of Information and Broadcasting',
    category: 'Gaming & Culture',
    description: 'Challenge your creative mind to conceptualize and develop unique toys and games based on our civilization, history, and culture etc.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-16',
    problemStatementCode: 'PS-AUTOMATION',
    name: 'Smart Automation',
    organization: 'Ministry of Heavy Industries / MeitY',
    category: 'AI & Automation',
    description: 'Ideas focused on the intelligent use of resources for transforming and advancements of technology with combining the artificial intelligence to explore more various sources and get valuable insights.',
    sihUrl: 'https://sih.gov.in/',
  },
  {
    id: 'sih-theme-17',
    problemStatementCode: 'PS-MISCELLANEOUS',
    name: 'Miscellaneous',
    organization: 'Cross-Ministry / Open Innovation',
    category: 'Open Category',
    description: 'Technology ideas in tertiary sectors like Hospitality, Entertainment and Retail.',
    sihUrl: 'https://sih.gov.in/',
  },
];

// Alias for backwards compatibility across existing imports
export const SIH_OFFICIAL_18_THEMES = SIH_OFFICIAL_17_THEMES;
export const SIH_OFFICIAL_THEMES = SIH_OFFICIAL_17_THEMES;
