import { prisma } from './prisma';
import { logger } from './logger';

export async function recalculateTeamSkills(teamId: string) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        track: true,
        members: true,
      },
    });

    if (!team) {
      console.warn(`Team with id ${teamId} not found during recalculation.`);
      return;
    }

    const rawSkills = team.members.flatMap((m) => m.skills);
    // Make unique and capitalize neatly
    const skillsCovered = Array.from(new Set(rawSkills.map((s) => s.trim()))).filter((s) => s !== '');

    // Define default required skills based on track category
    const category = team.track.category.toLowerCase();
    let defaultRequired: string[] = [];

    if (category.includes('software')) {
      defaultRequired = ['React', 'Node.js', 'Database', 'Git', 'CSS/UI', 'APIs'];
    } else if (category.includes('hardware')) {
      defaultRequired = ['IoT', 'Arduino/ESP32', 'Sensors', 'Embedded C', 'PCB Design', 'Power Mgmt'];
    } else {
      defaultRequired = ['React', 'Node.js', 'Git', 'UI/UX'];
    }

    const coveredLower = new Set(skillsCovered.map((s) => s.toLowerCase()));
    const skillsNeeded = defaultRequired.filter(
      (req) => !coveredLower.has(req.toLowerCase())
    );

    await prisma.team.update({
      where: { id: teamId },
      data: {
        memberCount: team.members.length,
        skillsCovered,
        skillsNeeded,
      },
    });  } catch (error) {
    // teamId travels as structured context rather than interpolated into the
    // message, so aggregators can group every occurrence as one issue instead
    // of one issue per team.
    logger.error('Failed to recalculate team skills', error, { teamId });
  }
}
