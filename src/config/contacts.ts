export interface FacultyContact {
  name: string;
  role: string;
  designation: string;
  department: string;
  category: 'SPOC' | 'MBA' | 'BTech 3rd & 4th Year' | 'BTech 2nd Year';
  phone?: string;
  email?: string;
  isSpoc?: boolean;
}

export interface StudentLead {
  name: string;
  role: string;
  title: string;
  linkedin: string;
  email: string;
  phone: string;
}

export const FACULTY_CONTACTS: FacultyContact[] = [
  {
    name: 'Er. Brijesh Kumar Umar',
    role: 'SPOC, SIH-2026',
    designation: 'Single Point of Contact (SPOC)',
    department: 'Smart India Hackathon 2026, GLBGOI',
    category: 'SPOC',
    phone: '+91 8953239022',
    email: 'brijesh.umar@glbajajgroup.org',
    isSpoc: true,
  },
  {
    name: 'Dr. Parul Jain',
    role: 'Faculty Coordinator (MBA)',
    designation: 'Assistant Professor',
    department: 'Department of Management Studies',
    category: 'MBA',
    phone: '+91 8302344690',
    email: 'parul.jain@glbajajgroup.org',
  },
  {
    name: 'Mr. Anurag Kumar Singh',
    role: 'Faculty Coordinator (B.Tech 3rd & 4th Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 3rd & 4th Year',
    phone: '+91 892914465',
    email: 'anurag.singh@glbajajgroup.org',
  },
  {
    name: 'Mr. Rahul Anjana',
    role: 'Faculty Coordinator (B.Tech 3rd & 4th Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 3rd & 4th Year',
    phone: '+91 9981468558',
    email: 'rahul.anjana@glbajajgroup.org',
  },
  {
    name: 'Ms. Swati Pandit',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
    phone: '+91 9058441616',
    email: 'swati.pandit@glbajajgroup.org',
  },
  {
    name: 'Ms. Srishti Mishra',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
    phone: '+91 7505925103',
    email: 'srishti.mishra@glbajajgroup.org',
  },
  {
    name: 'Mr. Anurag Singh',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
    phone: '+91 8953668442',
    email: 'anuragsingh@glbajajgroup.org',
  },
];

// Alias for exact testing and compatibility
export const FACULTY_COORDINATORS = FACULTY_CONTACTS;

// 1. FOOTER CONTACTS: Tanishk Bansal (1st), Ayush Sharma (2nd)
export const FOOTER_CONTACTS: StudentLead[] = [
  {
    name: 'Tanishk Bansal',
    role: 'SIH Coordinator',
    title: 'SIH Lead & Technical Operations',
    linkedin: 'https://www.linkedin.com/in/tanishk-bansal-',
    email: 'tanishk.bansal2025@glbajajgroup.org',
    phone: '+91 8534998412',
  },
  {
    name: 'Ayush Sharma',
    role: 'SIH Coordinator',
    title: 'SIH Lead & Platform Operations',
    linkedin: 'https://www.linkedin.com/in/ayushh-sharmaa/',
    email: 'ayush.sharma2025@glbajajgroup.org',
    phone: '+91 8923995135',
  },
];

// 2. CONTACT PAGE STUDENT COORDINATORS: Ayush Sharma (1st), Tanishk Bansal (2nd)
// "Student Lead" categorization removed -> "Student Coordinators & Platform Leads"
export const STUDENT_LEADS: StudentLead[] = [
  {
    name: 'Ayush Sharma',
    role: 'Student Coordinator & Platform Lead',
    title: 'Platform Architecture & Lead',
    linkedin: 'https://www.linkedin.com/in/ayushh-sharmaa/',
    email: 'ayush.sharma2025@glbajajgroup.org',
    phone: '+91 8923995135',
  },
  {
    name: 'Tanishk Bansal',
    role: 'Student Coordinator & Platform Lead',
    title: 'Technical Operations & Lead',
    linkedin: 'https://www.linkedin.com/in/tanishk-bansal-',
    email: 'tanishk.bansal2025@glbajajgroup.org',
    phone: '+91 8534998412',
  },
];

export const STUDENT_COORDINATORS = STUDENT_LEADS;

/** Backwards-compatible alias for existing components */
export type Contact = StudentLead;
export const CONTACTS: Contact[] = FOOTER_CONTACTS;

export interface InfoContact {
  title: string;
  organization: string;
  location: string;
  description: string;
}

export const SPOC_INFO: InfoContact = {
  title: 'SIH SPOC Coordination Desk',
  organization: 'GL Bajaj Group of Institutions',
  location: 'Mathura, UP',
  description: 'Single Point of Contact for institutional nominations, AICTE / Ministry communication, and college representation compliance.',
};

export const HELPDESK_INFO: InfoContact = {
  title: 'Campus & Hackathon Lab Helpdesk',
  organization: 'GL Bajaj Group of Institutions',
  location: 'Academic Block, GLBGOI Campus',
  description: 'On-site technical helpdesk providing student assistance, workstation lab allocation, and offline hackathon facilities.',
};
