import { prisma } from './prisma';

export async function recalculateTeamSkills(teamId: string) {
  try {
    // 1. Fetch the team and its track category, plus members' skills
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

    // 2. Aggregate all members' skills
    const rawSkills = team.members.flatMap((m: any) => m.skills);
    // Make unique and capitalize neatly
    const skillsCovered = Array.from(new Set(rawSkills.map((s: any) => s.trim()))).filter((s: any) => s !== '');

    // 3. Define default required skills based on track category
    const category = team.track.category.toLowerCase();
    let defaultRequired: string[] = [];

    if (category.includes('software')) {
      defaultRequired = ['React', 'Node.js', 'Database', 'Git', 'CSS/UI', 'APIs'];
    } else if (category.includes('hardware')) {
      defaultRequired = ['IoT', 'Arduino/ESP32', 'Sensors', 'Embedded C', 'PCB Design', 'Power Mgmt'];
    } else {
      defaultRequired = ['React', 'Node.js', 'Git', 'UI/UX'];
    }

    // 4. Calculate skillsNeeded (any defaultRequired not covered in members' skills)
    const coveredLower = new Set(skillsCovered.map((s: any) => s.toLowerCase()));
    const skillsNeeded = defaultRequired.filter(
      (req: any) => !coveredLower.has(req.toLowerCase())
    );

    // 5. Update team count and skills fields
    await prisma.team.update({
      where: { id: teamId },
      data: {
        memberCount: team.members.length,
        skillsCovered,
        skillsNeeded,
      },
    });  } catch (error) {
    console.error(`Failed to recalculate team skills for teamId ${teamId}:`, error);
  }
}
