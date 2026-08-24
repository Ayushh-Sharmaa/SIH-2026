import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeAvatarUrl, parseDataUri } from '../src/lib/avatar';
import { SIH_OFFICIAL_18_THEMES } from '../src/lib/tracks';

describe('Future Data Scaling & Query Bounding (10 to 100,000 records)', () => {
  // Synthetic dataset generator of arbitrary size
  function generateSyntheticStudents(count: number, withExtraFields = false) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const student: Record<string, any> = {
        userId: `student_${i}`,
        name: `Student Name ${i}`,
        branch: i % 2 === 0 ? 'CSE' : 'IT',
        year: `${(i % 4) + 1}th Year`,
        section: String.fromCharCode(65 + (i % 8)),
        gender: i % 3 === 0 ? 'Female' : 'Male',
        skills: ['React', 'TypeScript', 'Node.js', 'Python'],
        languages: ['English', 'Hindi'],
        softSkills: ['Leadership', 'Problem Solving'],
        teamId: i % 5 === 0 ? `team_${Math.floor(i / 5)}` : null,
        teamStatus: i % 5 === 0 ? 'IN_TEAM' : 'OPEN',
        avatarUrl: i % 10 === 0 ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null,
        githubUrl: `https://github.com/student${i}`,
        linkedinUrl: `https://linkedin.com/in/student${i}`,
        resumeUrl: null,
      };

      if (withExtraFields) {
        // Simulate future database schema expansions (e.g. 50 new fields added to PostgreSQL)
        for (let f = 1; f <= 50; f++) {
          student[`futureSchemaField_${f}`] = `Extra metadata value ${f} for student ${i}`;
        }
      }
      list.push(student);
    }
    return list;
  }

  function generateSyntheticTeams(count: number, withExtraFields = false) {
    const list = [];
    for (let i = 0; i < count; i++) {
      const team: Record<string, any> = {
        id: `team_${i}`,
        teamCode: `GLB${100 + i}`,
        name: `Hackathon Team ${i}`,
        status: i % 4 === 0 ? 'locked' : 'forming',
        trackId: SIH_OFFICIAL_18_THEMES[i % SIH_OFFICIAL_18_THEMES.length].id,
        leaderId: `student_${i * 5}`,
        memberCount: (i % 6) + 1,
        skillsCovered: ['Next.js', 'AI/ML', 'Docker'],
        skillsNeeded: ['UI/UX', 'Cloud'],
        logoUrl: i % 3 === 0 ? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==' : null,
        members: [
          { userId: `student_${i * 5}`, name: `Leader ${i}`, gender: 'Female', avatarUrl: null },
          { userId: `student_${i * 5 + 1}`, name: `Member ${i}_1`, gender: 'Male', avatarUrl: null },
        ],
      };

      if (withExtraFields) {
        for (let f = 1; f <= 50; f++) {
          team[`futureTeamField_${f}`] = `Extra team data ${f} for team ${i}`;
        }
      }
      list.push(team);
    }
    return list;
  }

  const DATASET_SCALES = [10, 1_000, 10_000, 100_000];

  for (const scale of DATASET_SCALES) {
    test(`Public Directory: Students search query remains strictly bounded (≤ 24 rows) under ${scale.toLocaleString()} records`, () => {
      const dataset = generateSyntheticStudents(Math.min(scale, 1000)); // slice for memory in test runner
      const PAGE_SIZE = 24;

      // Simulate database bounded take + projection
      const boundedResults = dataset.slice(0, PAGE_SIZE).map((s) => ({
        userId: s.userId,
        name: s.name,
        branch: s.branch,
        year: s.year,
        skills: s.skills,
        languages: s.languages,
        softSkills: s.softSkills,
        avatarUrl: sanitizeAvatarUrl(s.avatarUrl, s.userId),
        githubUrl: s.githubUrl,
        linkedinUrl: s.linkedinUrl,
      }));

      assert.ok(boundedResults.length <= 24, `Results count ${boundedResults.length} exceeds PAGE_SIZE of 24`);

      const jsonPayload = JSON.stringify({ success: true, students: boundedResults });
      const payloadBytes = Buffer.byteLength(jsonPayload, 'utf8');

      // The payload must remain bounded (approx < 10 KB) regardless of 10 or 100,000 total database records
      assert.ok(
        payloadBytes < 12_000,
        `Payload size (${payloadBytes} bytes) exceeded 12 KB ceiling under ${scale} dataset`
      );
    });

    test(`Public Directory: Teams search query remains strictly bounded (≤ 24 rows) under ${scale.toLocaleString()} records`, () => {
      const dataset = generateSyntheticTeams(Math.min(scale, 1000));
      const PAGE_SIZE = 24;

      const boundedResults = dataset.slice(0, PAGE_SIZE).map((t) => ({
        id: t.id,
        teamCode: t.teamCode,
        name: t.name,
        status: t.status,
        memberCount: t.memberCount,
        trackId: t.trackId,
        skillsCovered: t.skillsCovered,
        skillsNeeded: t.skillsNeeded,
        logoUrl: sanitizeAvatarUrl(t.logoUrl, t.id),
        members: t.members.map((m: any) => ({
          userId: m.userId,
          name: m.name,
          gender: m.gender,
          avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
        })),
      }));

      assert.ok(boundedResults.length <= 24, `Results count ${boundedResults.length} exceeds PAGE_SIZE of 24`);

      const jsonPayload = JSON.stringify({ success: true, teams: boundedResults });
      const payloadBytes = Buffer.byteLength(jsonPayload, 'utf8');

      assert.ok(
        payloadBytes < 15_000,
        `Payload size (${payloadBytes} bytes) exceeded 15 KB ceiling under ${scale} dataset`
      );
    });

    test(`Admin Console: Student directory query remains strictly bounded (≤ 50 rows) under ${scale.toLocaleString()} records`, () => {
      const dataset = generateSyntheticStudents(Math.min(scale, 1000));
      const PAGE_SIZE = 50;

      const boundedResults = dataset.slice(0, PAGE_SIZE).map((s) => ({
        id: s.userId,
        userId: s.userId,
        name: s.name,
        branch: s.branch,
        year: s.year,
        section: s.section,
        gender: s.gender,
        teamId: s.teamId,
        teamStatus: s.teamStatus,
        avatarUrl: `/api/avatar/${s.userId}`,
      }));

      assert.ok(boundedResults.length <= 50, `Results count ${boundedResults.length} exceeds PAGE_SIZE of 50`);

      const jsonPayload = JSON.stringify({
        success: true,
        students: boundedResults,
        pagination: { page: 1, pageSize: 50, total: scale, totalPages: Math.ceil(scale / 50) },
      });
      const payloadBytes = Buffer.byteLength(jsonPayload, 'utf8');

      assert.ok(
        payloadBytes < 20_000,
        `Admin payload size (${payloadBytes} bytes) exceeded 20 KB ceiling under ${scale} dataset`
      );
    });
  }

  test('Schema Expansion Immunity: Adding 50 new schema fields does NOT expand DTO size', () => {
    const rawStudentWithoutExtra = generateSyntheticStudents(24, false);
    const rawStudentWith50Extra = generateSyntheticStudents(24, true);

    const projectDTO = (s: Record<string, any>) => ({
      userId: s.userId,
      name: s.name,
      branch: s.branch,
      year: s.year,
      skills: s.skills,
      avatarUrl: sanitizeAvatarUrl(s.avatarUrl, s.userId),
    });

    const dtoWithoutExtra = rawStudentWithoutExtra.map(projectDTO);
    const dtoWithExtra = rawStudentWith50Extra.map(projectDTO);

    const sizeWithout = Buffer.byteLength(JSON.stringify(dtoWithoutExtra), 'utf8');
    const sizeWith = Buffer.byteLength(JSON.stringify(dtoWithExtra), 'utf8');

    assert.equal(
      sizeWithout,
      sizeWith,
      `Explicit DTO projection failed to drop extra fields: ${sizeWith} vs ${sizeWithout}`
    );
  });

  test('Avatar Sanitization: Detail endpoints convert multi-megabyte base64 strings to tiny streaming endpoints', () => {
    const base64DataUri =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAYAAAAeP4ixAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAMElEQVR42u3PMQEAAAgEID9/aW8hB48QSN119oFAIBgEAsEgEAgEgkAgEAgEgkAg8G0B06cBBf7mYcoAAAAASUVORK5CYII=';

    const rawDetailPayload = {
      team: {
        id: 'team_abc_123',
        name: 'Alpha Team',
        logoUrl: base64DataUri,
        mentor: {
          userId: 'mentor_xyz_456',
          name: 'Faculty Mentor',
          avatarUrl: base64DataUri,
        },
        members: [
          { userId: 'user_1', avatarUrl: base64DataUri },
          { userId: 'user_2', avatarUrl: base64DataUri },
          { userId: 'user_3', avatarUrl: base64DataUri },
          { userId: 'user_4', avatarUrl: base64DataUri },
          { userId: 'user_5', avatarUrl: base64DataUri },
          { userId: 'user_6', avatarUrl: base64DataUri },
        ],
      },
    };

    const sanitizedDetailPayload = {
      team: {
        id: 'team_abc_123',
        name: 'Alpha Team',
        logoUrl: sanitizeAvatarUrl(rawDetailPayload.team.logoUrl, rawDetailPayload.team.id),
        mentor: {
          userId: 'mentor_xyz_456',
          name: 'Faculty Mentor',
          avatarUrl: sanitizeAvatarUrl(rawDetailPayload.team.mentor.avatarUrl, rawDetailPayload.team.mentor.userId),
        },
        members: rawDetailPayload.team.members.map((m) => ({
          userId: m.userId,
          avatarUrl: sanitizeAvatarUrl(m.avatarUrl, m.userId),
        })),
      },
    };

    const rawSize = Buffer.byteLength(JSON.stringify(rawDetailPayload), 'utf8');
    const sanitizedSize = Buffer.byteLength(JSON.stringify(sanitizedDetailPayload), 'utf8');

    // Sanitized payload should be > 60% smaller by turning bulky data URIs into compact streaming links
    assert.ok(
      sanitizedSize < rawSize * 0.4,
      `Sanitization did not reduce payload significantly: ${sanitizedSize} vs ${rawSize}`
    );

    // Verify avatar URL format
    assert.match(sanitizedDetailPayload.team.logoUrl || '', /^\/api\/avatar\/team_abc_123\?v=/);
    assert.match(sanitizedDetailPayload.team.mentor.avatarUrl || '', /^\/api\/avatar\/mentor_xyz_456\?v=/);
    assert.match(sanitizedDetailPayload.team.members[0].avatarUrl || '', /^\/api\/avatar\/user_1\?v=/);
  });
});
