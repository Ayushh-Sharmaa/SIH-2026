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
          id: 'track-1',
          name: 'Smart Health Monitoring System',
          problemStatementCode: 'SIH1299',
          description: 'Develop an AI-powered system that tracks patients vitals in real-time, predicts health anomalies, and alerts medical professionals automatically.',
          category: 'Software',
        },
        {
          id: 'track-2',
          name: 'Automated Crop Disease Detection',
          problemStatementCode: 'SIH1300',
          description: 'A mobile/web platform utilizing computer vision models to identify crop diseases from leaf images, providing remediation methods and weather risk assessments.',
          category: 'Software',
        },
        {
          id: 'track-3',
          name: 'AI-based Traffic Management System',
          problemStatementCode: 'SIH1301',
          description: 'An intelligent system that leverages CCTV feeds to analyze traffic density at intersections and dynamically adjust signal timings to minimize congestion.',
          category: 'Software',
        },
        {
          id: 'track-4',
          name: 'IoT Smart Electric Metering Grid',
          problemStatementCode: 'SIH1302',
          description: 'A hardware-software hybrid framework for real-time monitoring of electricity consumption, detection of line faults, and prevention of power theft.',
          category: 'Hardware',
        },
        {
          id: 'track-5',
          name: 'Security Threat Assessment Portal',
          problemStatementCode: 'SIH1303',
          description: 'A cyber threat hunting tool that monitors log files, calculates risk factor metrics, and provides defensive playbook recommendations.',
          category: 'Software',
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

function saveDb(data: any) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
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
      return user || null;
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
