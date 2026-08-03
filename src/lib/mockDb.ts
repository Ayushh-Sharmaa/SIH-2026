import fs from 'fs';
import path from 'path';

const DB_FILE = path.join(process.cwd(), 'src', 'lib', 'db.json');

function loadDb() {
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      users: [] as any[],
      studentProfiles: [] as any[],
      mentorProfiles: [] as any[],
      tracks: [
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
          name: 'Games & Toys',
          organization: 'Ministry of Information and Broadcasting',
          category: 'Gaming & Culture',
          description: 'Challenge your creative mind to conceptualize and develop unique toys and games based on our civilization, history, and culture etc.',
          sihUrl: 'https://sih.gov.in/',
        },
        {
          id: 'sih-theme-16',
          problemStatementCode: 'PS-MISCELLANEOUS',
          name: 'Miscellaneous',
          organization: 'Cross-Ministry / Open Innovation',
          category: 'Open Category',
          description: 'Technology ideas in tertiary sectors like Hospitality, Entertainment and Retail.',
          sihUrl: 'https://sih.gov.in/',
        },
        {
          id: 'sih-theme-17',
          problemStatementCode: 'PS-FINTECH',
          name: 'FinTech',
          organization: 'Ministry of Finance / RBI',
          category: 'Finance & Banking',
          description: 'Challenges related to the financial services.',
          sihUrl: 'https://sih.gov.in/',
        },
        {
          id: 'sih-theme-18',
          problemStatementCode: 'PS-AUTOMATION',
          name: 'Smart Automation',
          organization: 'Ministry of Heavy Industries / MeitY',
          category: 'AI & Automation',
          description: 'Ideas focused on the intelligent use of resources for transforming and advancements of technology with combining the artificial intelligence to explore more various sources and get valuable insights.',
          sihUrl: 'https://sih.gov.in/',
        },
      ] as any[],
      mentorRegistrationKeys: [
        { key: 'GLB-MENTOR-2026-NEXA' },
        { key: 'GLB-MENTOR-2026-FACULTY' },
        { key: 'GLB-MENTOR-2026-VIP' },
      ] as any[],
      teams: [] as any[],
      joinRequests: [] as any[],
      teamInvites: [] as any[],
      mentorRequests: [] as any[],
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2));
    return initialDb;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  } catch (e) {
    // If corrupt, return empty templates
    return {
      users: [],
      studentProfiles: [],
      mentorProfiles: [],
      tracks: [],
      mentorRegistrationKeys: [],
      teams: [],
      joinRequests: [],
      teamInvites: [],
      mentorRequests: [],
    };
  }
}

let memoryDbCache: any = null;

function saveDb(data: any) {
  memoryDbCache = data;
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    // Read-only filesystem fallback (e.g. Vercel serverless runtime)
  }
}

// Admin Email Access Management
export function getAdminEmails(): string[] {
  const db = loadDb();
  if (!db.adminEmails || !Array.isArray(db.adminEmails)) {
    db.adminEmails = ['tanishk.bansal2025@glbajajgroup.org'];
    saveDb(db);
  }
  return db.adminEmails;
}

export function addAdminEmail(email: string): string[] {
  const db = loadDb();
  if (!db.adminEmails || !Array.isArray(db.adminEmails)) {
    db.adminEmails = ['tanishk.bansal2025@glbajajgroup.org'];
  }
  const clean = email.toLowerCase().trim();
  if (clean && !db.adminEmails.map((e: string) => e.toLowerCase()).includes(clean)) {
    db.adminEmails.push(clean);
    const user = db.users.find((u: any) => u.email.toLowerCase() === clean);
    if (user) {
      user.role = 'ADMIN';
    }
    saveDb(db);
  }
  return db.adminEmails;
}

export function removeAdminEmail(email: string): string[] {
  const db = loadDb();
  if (!db.adminEmails) return [];
  const clean = email.toLowerCase().trim();
  if (clean === 'tanishk.bansal2025@glbajajgroup.org') {
    return db.adminEmails;
  }
  db.adminEmails = db.adminEmails.filter((e: string) => e.toLowerCase() !== clean);
  const user = db.users.find((u: any) => u.email.toLowerCase() === clean);
  if (user && user.role === 'ADMIN') {
    user.role = 'STUDENT';
  }
  saveDb(db);
  return db.adminEmails;
}

export function isAuthorizedAdminEmail(email: string): boolean {
  const clean = email.replace(/\/admin$/i, '').toLowerCase().trim();
  const list = getAdminEmails();
  return list.map((e: string) => e.toLowerCase()).includes(clean) || clean === 'tanishk.bansal2025@glbajajgroup.org';
}

// User Ban & Access Revocation Management
export function getBannedEmails(): string[] {
  const db = loadDb();
  if (!db.bannedEmails || !Array.isArray(db.bannedEmails)) {
    db.bannedEmails = [];
    saveDb(db);
  }
  return db.bannedEmails;
}

export function banUserEmail(email: string): string[] {
  const db = loadDb();
  if (!db.bannedEmails || !Array.isArray(db.bannedEmails)) {
    db.bannedEmails = [];
  }
  const clean = email.toLowerCase().trim();
  if (clean && !db.bannedEmails.includes(clean)) {
    db.bannedEmails.push(clean);
    saveDb(db);
  }
  return db.bannedEmails;
}

export function unbanUserEmail(email: string): string[] {
  const db = loadDb();
  if (!db.bannedEmails) return [];
  const clean = email.toLowerCase().trim();
  db.bannedEmails = db.bannedEmails.filter((e: string) => e.toLowerCase() !== clean);
  saveDb(db);
  return db.bannedEmails;
}

export function isUserBanned(email: string): boolean {
  if (!email) return false;
  const clean = email.toLowerCase().trim();
  const list = getBannedEmails();
  return list.includes(clean);
}

// Generate random UUID
function uuid() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

export const mockPrisma = {
  user: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const where = args.where;
      const user = db.users.find((u: any) => {
        if (where.email && u.email === where.email) return true;
        if (where.id && u.id === where.id) return true;
        return false;
      });
      if (!user) return null;
      const studentProfile = db.studentProfiles.find((sp: any) => sp.userId === user.id);
      const mentorProfile = db.mentorProfiles.find((mp: any) => mp.userId === user.id);
      return {
        ...user,
        studentProfile: studentProfile || null,
        mentorProfile: mentorProfile || null,
      };
    },
    findMany: async () => {
      const db = loadDb();
      return db.users.map((u: any) => {
        const studentProfile = db.studentProfiles.find((sp: any) => sp.userId === u.id);
        const mentorProfile = db.mentorProfiles.find((mp: any) => mp.userId === u.id);
        return {
          ...u,
          studentProfile: studentProfile || null,
          mentorProfile: mentorProfile || null,
        };
      });
    },
    create: async (args: any) => {
      const db = loadDb();
      const newUser = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        college: "GL Bajaj Group of Institutions, Mathura",
        verifiedAt: null,
        ...args.data,
      };
      db.users.push(newUser);
      saveDb(db);
      return newUser;
    },
  },

  mentorRegistrationKey: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const key = db.mentorRegistrationKeys.find((k: any) => k.key === args.where.key);
      return key || null;
    },
  },

  studentProfile: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const profile = db.studentProfiles.find((sp: any) => sp.userId === args.where.userId);
      if (!profile) return null;

      // Hydrate relations if requested (e.g. include user or team)
      const user = db.users.find((u: any) => u.id === profile.userId);
      const team = profile.teamId ? db.teams.find((t: any) => t.id === profile.teamId) : null;
      const hydratedTeam = team
        ? {
            ...team,
            track: db.tracks.find((track: any) => track.id === team.trackId) || null,
            members: db.studentProfiles
              .filter((member: any) => member.teamId === team.id)
              .map((member: any) => ({
                ...member,
                user: db.users.find((memberUser: any) => memberUser.id === member.userId) || null,
              })),
            mentor: team.mentorId
              ? db.mentorProfiles.find((mentor: any) => mentor.userId === team.mentorId) || null
              : null,
          }
        : null;
      return {
        ...profile,
        user: user || null,
        team: hydratedTeam,
      };
    },
    create: async (args: any) => {
      const db = loadDb();
      const newProfile = {
        skills: [],
        languages: [],
        softSkills: [],
        resumeUrl: null,
        githubUrl: null,
        linkedinUrl: null,
        avatarUrl: null,
        teamStatus: 'OPEN',
        teamId: null,
        ...args.data,
      };
      db.studentProfiles.push(newProfile);
      saveDb(db);
      return newProfile;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.studentProfiles.findIndex((sp: any) => sp.userId === args.where.userId);
      if (idx === -1) throw new Error("Student profile not found");

      // Handle trackInterest relation updates (simply map array of track ids)
      let data = { ...args.data };
      if (data.trackInterest) {
        if (data.trackInterest.set) {
          data.trackInterest = data.trackInterest.set.map((t: any) => t.id);
        }
      }

      db.studentProfiles[idx] = {
        ...db.studentProfiles[idx],
        ...data,
      };
      saveDb(db);
      return db.studentProfiles[idx];
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.studentProfiles];

      // Filters
      if (args && args.where) {
        const where = args.where;
        if (where.teamStatus) {
          list = list.filter((sp) => sp.teamStatus === where.teamStatus);
        }
        if (where.userId && where.userId.not) {
          list = list.filter((sp) => sp.userId !== where.userId.not);
        }
        if (where.trackInterest && where.trackInterest.some) {
          const trackId = where.trackInterest.some.id;
          list = list.filter((sp) => Array.isArray(sp.trackInterest) && sp.trackInterest.includes(trackId));
        }
      }

      // Hydrate user
      return list.map((sp) => {
        const user = db.users.find((u: any) => u.id === sp.userId);
        return {
          ...sp,
          user: user || null,
        };
      });
    },
    updateMany: async (args: any) => {
      const db = loadDb();
      const where = args.where || {};
      let count = 0;
      db.studentProfiles = db.studentProfiles.map((sp: any) => {
        if (where.teamId && sp.teamId !== where.teamId) return sp;
        count++;
        return {
          ...sp,
          ...args.data,
        };
      });
      saveDb(db);
      return { count };
    },
  },

  mentorProfile: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const profile = db.mentorProfiles.find((mp: any) => mp.userId === args.where.userId);
      if (!profile) return null;
      const user = db.users.find((u: any) => u.id === profile.userId);
      return {
        ...profile,
        user: user || null,
      };
    },
    create: async (args: any) => {
      const db = loadDb();
      const newProfile = {
        expertise: [],
        capacity: 2,
        currentLoad: 0,
        verified: false,
        bio: null,
        linkedinUrl: null,
        registrationKey: null,
        ...args.data,
      };
      db.mentorProfiles.push(newProfile);
      saveDb(db);
      return newProfile;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.mentorProfiles.findIndex((mp: any) => mp.userId === args.where.userId);
      if (idx === -1) throw new Error("Mentor profile not found");
      db.mentorProfiles[idx] = {
        ...db.mentorProfiles[idx],
        ...args.data,
      };
      saveDb(db);
      return db.mentorProfiles[idx];
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.mentorProfiles];
      if (args && args.where) {
        if (args.where.verified !== undefined) {
          list = list.filter((mp) => mp.verified === args.where.verified);
        }
      }
      return list.map((mp) => {
        const user = db.users.find((u: any) => u.id === mp.userId);
        return {
          ...mp,
          user: user || null,
        };
      });
    },
  },

  track: {
    findMany: async () => {
      const db = loadDb();
      return db.tracks.map((t: any) => {
        // Count teams registered to this track
        const count = db.teams.filter((team: any) => team.trackId === t.id).length;
        return {
          ...t,
          _count: { teams: count },
        };
      });
    },
    findUnique: async (args: any) => {
      const db = loadDb();
      const track = db.tracks.find((t: any) => t.id === args.where.id || t.problemStatementCode === args.where.problemStatementCode);
      return track || null;
    },
  },

  team: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const team = db.teams.find((t: any) => t.id === args.where.id);
      if (!team) return null;

      // Hydrate relations
      const track = db.tracks.find((tr: any) => tr.id === team.trackId);
      const members = db.studentProfiles.filter((sp: any) => sp.teamId === team.id);
      const mentor = team.mentorId ? db.mentorProfiles.find((mp: any) => mp.userId === team.mentorId) : null;

      return {
        ...team,
        track: track || null,
        members: members || [],
        mentor: mentor || null,
      };
    },
    create: async (args: any) => {
      const db = loadDb();
      const newTeam = {
        id: uuid(),
        status: 'forming',
        memberCount: 1,
        skillsCovered: [],
        skillsNeeded: [],
        mentorId: null,
        whatsapp: null,
        ...args.data,
      };
      db.teams.push(newTeam);
      saveDb(db);
      return newTeam;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.teams.findIndex((t: any) => t.id === args.where.id);
      if (idx === -1) throw new Error("Team not found");
      db.teams[idx] = {
        ...db.teams[idx],
        ...args.data,
      };
      saveDb(db);
      return db.teams[idx];
    },
    delete: async (args: any) => {
      const db = loadDb();
      const idx = db.teams.findIndex((t: any) => t.id === args.where.id);
      if (idx === -1) throw new Error("Team not found");
      const deleted = db.teams.splice(idx, 1)[0];
      saveDb(db);
      return deleted;
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.teams];
      if (args && args.where) {
        if (args.where.mentorId) {
          list = list.filter((t) => t.mentorId === args.where.mentorId);
        }
      }
      return list.map((team) => {
        const track = db.tracks.find((tr: any) => tr.id === team.trackId);
        return {
          ...team,
          track: track || null,
        };
      });
    },
  },

  joinRequest: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const req = db.joinRequests.find((r: any) => r.id === args.where.id);
      if (!req) return null;
      const team = db.teams.find((t: any) => t.id === req.teamId);
      const members = db.studentProfiles.filter((sp: any) => sp.teamId === req.teamId);
      return {
        ...req,
        team: team ? { ...team, members } : null,
      };
    },
    findFirst: async (args: any) => {
      const db = loadDb();
      const req = db.joinRequests.find((r: any) => {
        if (args.where.teamId && r.teamId !== args.where.teamId) return false;
        if (args.where.studentId && r.studentId !== args.where.studentId) return false;
        if (args.where.status && r.status !== args.where.status) return false;
        return true;
      });
      return req || null;
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.joinRequests];
      if (args && args.where) {
        if (args.where.teamId) {
          list = list.filter((r) => r.teamId === args.where.teamId);
        }
        if (args.where.status) {
          list = list.filter((r) => r.status === args.where.status);
        }
      }
      return list.map((req) => {
        const student = db.studentProfiles.find((sp: any) => sp.userId === req.studentId);
        return {
          ...req,
          student: student || null,
        };
      });
    },
    create: async (args: any) => {
      const db = loadDb();
      const newReq = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...args.data,
      };
      db.joinRequests.push(newReq);
      saveDb(db);
      return newReq;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.joinRequests.findIndex((r: any) => r.id === args.where.id);
      if (idx === -1) throw new Error("Request not found");
      db.joinRequests[idx] = {
        ...db.joinRequests[idx],
        ...args.data,
      };
      saveDb(db);
      return db.joinRequests[idx];
    },
    updateMany: async (args: any) => {
      const db = loadDb();
      const where = args.where;
      let count = 0;
      db.joinRequests = db.joinRequests.map((r: any) => {
        if (where.studentId && r.studentId !== where.studentId) return r;
        if (where.status && r.status !== where.status) return r;
        count++;
        return {
          ...r,
          ...args.data,
        };
      });
      saveDb(db);
      return { count };
    },
  },

  teamInvite: {
    findFirst: async (args: any) => {
      const db = loadDb();
      const invite = db.teamInvites.find((i: any) => {
        if (args.where.teamId && i.teamId !== args.where.teamId) return false;
        if (args.where.studentId && i.studentId !== args.where.studentId) return false;
        if (args.where.status && i.status !== args.where.status) return false;
        return true;
      });
      return invite || null;
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.teamInvites];
      if (args && args.where) {
        if (args.where.studentId) {
          list = list.filter((i) => i.studentId === args.where.studentId);
        }
        if (args.where.status) {
          list = list.filter((i) => i.status === args.where.status);
        }
      }
      return list.map((inv) => {
        const team = db.teams.find((t: any) => t.id === inv.teamId);
        const track = team ? db.tracks.find((tr: any) => tr.id === team.trackId) : null;
        return {
          ...inv,
          team: team ? { ...team, track } : null,
        };
      });
    },
    create: async (args: any) => {
      const db = loadDb();
      const newInvite = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...args.data,
      };
      db.teamInvites.push(newInvite);
      saveDb(db);
      return newInvite;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.teamInvites.findIndex((i: any) => i.id === args.where.id);
      if (idx === -1) throw new Error("Invite not found");
      db.teamInvites[idx] = {
        ...db.teamInvites[idx],
        ...args.data,
      };
      saveDb(db);
      return db.teamInvites[idx];
    },
    updateMany: async (args: any) => {
      const db = loadDb();
      const where = args.where;
      let count = 0;
      db.teamInvites = db.teamInvites.map((i: any) => {
        if (where.studentId && i.studentId !== where.studentId) return i;
        if (where.status && i.status !== where.status) return i;
        count++;
        return {
          ...i,
          ...args.data,
        };
      });
      saveDb(db);
      return { count };
    },
    findUnique: async (args: any) => {
      const db = loadDb();
      const invite = db.teamInvites.find((i: any) => i.id === args.where.id);
      if (!invite) return null;
      const team = db.teams.find((t: any) => t.id === invite.teamId);
      const members = db.studentProfiles.filter((sp: any) => sp.teamId === invite.teamId);
      return {
        ...invite,
        team: team ? { ...team, members } : null,
      };
    },
  },

  mentorRequest: {
    findUnique: async (args: any) => {
      const db = loadDb();
      const req = db.mentorRequests.find((r: any) => r.id === args.where.id);
      if (!req) return null;
      const team = db.teams.find((t: any) => t.id === req.teamId);
      const mentor = db.mentorProfiles.find((mp: any) => mp.userId === req.mentorId);
      return {
        ...req,
        team: team || null,
        mentor: mentor || null,
      };
    },
    findFirst: async (args: any) => {
      const db = loadDb();
      const req = db.mentorRequests.find((r: any) => {
        if (args.where.teamId && r.teamId !== args.where.teamId) return false;
        if (args.where.mentorId && r.mentorId !== args.where.mentorId) return false;
        if (args.where.status && r.status !== args.where.status) return false;
        return true;
      });
      return req || null;
    },
    findMany: async (args: any) => {
      const db = loadDb();
      let list = [...db.mentorRequests];
      if (args && args.where) {
        if (args.where.mentorId) {
          list = list.filter((r) => r.mentorId === args.where.mentorId);
        }
        if (args.where.status) {
          list = list.filter((r) => r.status === args.where.status);
        }
      }
      return list.map((req) => {
        const team = db.teams.find((t: any) => t.id === req.teamId);
        const track = team ? db.tracks.find((tr: any) => tr.id === team.trackId) : null;
        return {
          ...req,
          team: team ? { ...team, track } : null,
        };
      });
    },
    create: async (args: any) => {
      const db = loadDb();
      const newReq = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        ...args.data,
      };
      db.mentorRequests.push(newReq);
      saveDb(db);
      return newReq;
    },
    update: async (args: any) => {
      const db = loadDb();
      const idx = db.mentorRequests.findIndex((r: any) => r.id === args.where.id);
      if (idx === -1) throw new Error("Request not found");
      db.mentorRequests[idx] = {
        ...db.mentorRequests[idx],
        ...args.data,
      };
      saveDb(db);
      return db.mentorRequests[idx];
    },
    updateMany: async (args: any) => {
      const db = loadDb();
      const where = args.where;
      let count = 0;
      db.mentorRequests = db.mentorRequests.map((r: any) => {
        if (where.teamId && r.teamId !== where.teamId) return r;
        if (where.status && r.status !== where.status) return r;
        count++;
        return {
          ...r,
          ...args.data,
        };
      });
      saveDb(db);
      return { count };
    },
  },

  $transaction: async (callback: any) => {
    // Transaction wrapper calls callback passing itself as transaction instance
    return await callback(mockPrisma);
  },
};
