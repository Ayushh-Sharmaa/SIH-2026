import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { prisma } from '../src/lib/prisma';
import { nextTeamCode } from '../src/lib/teamCode';

const hasDb = process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('<project-ref>') &&
  !process.env.DATABASE_URL.includes('[PROJECT-ID]');

if (!hasDb) {
  describe('Integration flows (DATABASE_URL not configured)', () => {
    test('skip tests', () => {
      console.log('Skipping integration tests: DATABASE_URL not set in environment.');
    });
  });
} else {
  describe('Backend Integration Flows', () => {
    let leaderUserId: string;
    let memberUserId: string;
    let mentorUserId: string;
    let teamId: string;
    let trackId: string;

    before(async () => {
      // Find a valid track in the database to use
      const track = await prisma.track.findFirst();
      if (!track) {
        // Create a dummy track if none exists
        const newTrack = await prisma.track.create({
          data: {
            name: 'Integration Test Track',
            problemStatementCode: 'INTTEST9999',
            description: 'Testing track',
            category: 'Software',
          },
        });
        trackId = newTrack.id;
      } else {
        trackId = track.id;
      }

      // 1. Create Leader User & Profile
      const leaderUser = await prisma.user.create({
        data: {
          email: 'integration-leader@gmail.com',
          passwordHash: 'dummyhash',
          role: 'STUDENT',
          studentProfile: {
            create: {
              name: 'Integration Leader',
              year: '3rd Year',
              branch: 'CSE',
              gender: 'Male',
              skills: ['React', 'Node'],
              languages: ['English'],
              softSkills: ['Presentation'],
            },
          },
        },
      });
      leaderUserId = leaderUser.id;

      // 2. Create Member User & Profile
      const memberUser = await prisma.user.create({
        data: {
          email: 'integration-member@gmail.com',
          passwordHash: 'dummyhash',
          role: 'STUDENT',
          studentProfile: {
            create: {
              name: 'Integration Member',
              year: '3rd Year',
              branch: 'CSE',
              gender: 'Female',
              skills: ['TypeScript', 'CSS'],
              languages: ['English'],
              softSkills: ['Writing'],
            },
          },
        },
      });
      memberUserId = memberUser.id;

      // 3. Create Mentor User & Profile
      const mentorUser = await prisma.user.create({
        data: {
          email: 'integration-mentor@gmail.com',
          passwordHash: 'dummyhash',
          role: 'MENTOR',
          mentorProfile: {
            create: {
              name: 'Integration Mentor',
              designation: 'Staff Software Engineer',
              organization: 'Google',
              verified: true,
              expertise: ['React', 'Postgres'],
            },
          },
        },
      });
      mentorUserId = mentorUser.id;
    });

    after(async () => {
      // Clean up in correct order to avoid constraint violations
      if (teamId) {
        await prisma.team.deleteMany({ where: { id: teamId } });
      }
      
      const userIds = [leaderUserId, memberUserId, mentorUserId].filter(Boolean);
      if (userIds.length > 0) {
        await prisma.user.deleteMany({ where: { id: { in: userIds } } });
      }
      
      // If we created a dummy track, delete it
      await prisma.track.deleteMany({ where: { problemStatementCode: 'INTTEST9999' } });
    });

    test('Team Creation & Member Join Request Flow', async () => {
      // 1. Create a team with the leader
      const team = await prisma.$transaction(async (tx) => {
        const teamCode = await nextTeamCode(tx);
        return tx.team.create({
          data: {
            name: 'Integration Test Team',
            teamCode,
            trackId,
            leaderId: leaderUserId,
            status: 'forming',
            members: {
              connect: { userId: leaderUserId },
            },
          },
        });
      });
      teamId = team.id;

      // Verify team was created and leader is assigned
      assert.equal(team.name, 'Integration Test Team');
      assert.equal(team.leaderId, leaderUserId);
      assert.equal(team.memberCount, 1);

      // Verify leader's profile has the team ID and is in IN_TEAM status
      const leaderProfile = await prisma.studentProfile.update({
        where: { userId: leaderUserId },
        data: { teamId: team.id, teamStatus: 'IN_TEAM', roleInTeam: 'Leader' },
      });
      assert.equal(leaderProfile.teamId, team.id);
      assert.equal(leaderProfile.teamStatus, 'IN_TEAM');

      // 2. Student Member sends Join Request
      const joinRequest = await prisma.joinRequest.create({
        data: {
          teamId: team.id,
          studentId: memberUserId,
          message: 'Hello, I want to join!',
          status: 'pending',
        },
      });

      assert.equal(joinRequest.status, 'pending');
      assert.equal(joinRequest.studentId, memberUserId);
      assert.equal(joinRequest.teamId, team.id);

      // 3. Team Leader responds and accepts Join Request
      await prisma.$transaction(async (tx) => {
        // Accept request
        await tx.joinRequest.update({
          where: { id: joinRequest.id },
          data: { status: 'accepted' },
        });

        // Add to team: update member count
        await tx.team.update({
          where: { id: team.id },
          data: { memberCount: { increment: 1 } },
        });

        // Update student profile
        await tx.studentProfile.update({
          where: { userId: memberUserId },
          data: {
            teamId: team.id,
            teamStatus: 'IN_TEAM',
            roleInTeam: 'Member',
          },
        });
      });

      // Assertions after join request acceptance
      const updatedRequest = await prisma.joinRequest.findUnique({
        where: { id: joinRequest.id },
      });
      assert.equal(updatedRequest?.status, 'accepted');

      const updatedTeam = await prisma.team.findUnique({
        where: { id: team.id },
      });
      assert.equal(updatedTeam?.memberCount, 2);

      const memberProfile = await prisma.studentProfile.findUnique({
        where: { userId: memberUserId },
      });
      assert.equal(memberProfile?.teamId, team.id);
      assert.equal(memberProfile?.teamStatus, 'IN_TEAM');
    });

    test('Team Mentor Request & Guidance Approval Flow', async () => {
      // 1. Team sends a Mentorship Request to the Mentor
      const mentorRequest = await prisma.mentorRequest.create({
        data: {
          teamId,
          mentorId: mentorUserId,
          message: 'Please be our mentor!',
          status: 'pending',
        },
      });

      assert.equal(mentorRequest.status, 'pending');
      assert.equal(mentorRequest.mentorId, mentorUserId);
      assert.equal(mentorRequest.teamId, teamId);

      // 2. Mentor responds and accepts the Mentorship Request
      await prisma.$transaction(async (tx) => {
        await tx.mentorRequest.update({
          where: { id: mentorRequest.id },
          data: { status: 'accepted' },
        });

        await tx.team.update({
          where: { id: teamId },
          data: { mentorId: mentorUserId },
        });

      });

      // Assertions after mentor request acceptance
      const updatedRequest = await prisma.mentorRequest.findUnique({
        where: { id: mentorRequest.id },
      });
      assert.equal(updatedRequest?.status, 'accepted');

      const updatedTeam = await prisma.team.findUnique({
        where: { id: teamId },
      });
      assert.equal(updatedTeam?.mentorId, mentorUserId);

      const guidedTeamsCount = await prisma.team.count({
        where: { mentorId: mentorUserId },
      });
      assert.equal(guidedTeamsCount, 1);
    });

    test('Deleted team codes remain permanently retired', async () => {
      const retired = await prisma.$transaction(async (tx) => {
        const teamCode = await nextTeamCode(tx);
        return tx.team.create({
          data: {
            name: 'Retired Code Test Team',
            teamCode,
            trackId,
            leaderId: leaderUserId,
          },
        });
      });

      await prisma.team.delete({ where: { id: retired.id } });

      const reservation = await (prisma as any).teamCodeReservation?.findUnique({
        where: { code: retired.teamCode },
      });
      if (reservation) {
        assert.equal(reservation.code, retired.teamCode);
      }

      const successor = await prisma.$transaction(async (tx) => {
        const teamCode = await nextTeamCode(tx);
        return tx.team.create({
          data: {
            name: 'Successor Code Test Team',
            teamCode,
            trackId,
            leaderId: leaderUserId,
          },
        });
      });

      assert.notEqual(successor.teamCode, retired.teamCode);
      assert.ok(
        Number(successor.teamCode.slice(3)) > Number(retired.teamCode.slice(3)),
        'The sequence must advance instead of recycling a deleted team code.'
      );
      await prisma.team.delete({ where: { id: successor.id } });
    });
  });
}
