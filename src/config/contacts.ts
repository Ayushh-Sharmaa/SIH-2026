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
    isSpoc: true,
  },
  {
    name: 'Dr. Parul Jain',
    role: 'Faculty Coordinator (MBA)',
    designation: 'Assistant Professor',
    department: 'Department of Management Studies',
    category: 'MBA',
  },
  {
    name: 'Mr. Anurag Kumar Singh',
    role: 'Faculty Coordinator (B.Tech 3rd & 4th Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 3rd & 4th Year',
  },
  {
    name: 'Mr. Rahul Anjana',
    role: 'Faculty Coordinator (B.Tech 3rd & 4th Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 3rd & 4th Year',
  },
  {
    name: 'Ms. Swati Pandit',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
  },
  {
    name: 'Ms. Srishti Mishra',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
    phone: '+91 7505925103',
  },
  {
    name: 'Mr. Anurag Singh',
    role: 'Faculty Coordinator (B.Tech 2nd Year)',
    designation: 'Assistant Professor',
    department: 'Department of Computer Science and Engineering',
    category: 'BTech 2nd Year',
    phone: '+91 8953668442',
  },
];

export const STUDENT_LEADS: StudentLead[] = [
  {
    name: 'Ayush Sharma',
    role: 'SIH Coordinator',
    title: 'SIH Lead & Platform Operations',
    linkedin: 'https://www.linkedin.com/in/ayushh-sharmaa/',
    email: 'ayush.sharma2025@glbajajgroup.org',
    phone: '+91 8923995135',
  },
  {
    name: 'Tanishk Bansal',
    role: 'SIH Coordinator',
    title: 'SIH Lead & Technical Operations',
    linkedin: 'https://www.linkedin.com/in/tanishk-bansal-',
    email: 'tanishk.bansal2025@glbajajgroup.org',
    phone: '+91 8534998412',
  },
];

/** Backwards-compatible alias for existing components */
export type Contact = StudentLead;
export const CONTACTS: Contact[] = STUDENT_LEADS;
