import { prisma } from '../src/lib/prisma';

async function diagnose() {
  console.log('--- DIAGNOSING STUDENT PAYLOADS ---');
  const students = await prisma.studentProfile.findMany({ take: 24 });
  let totalStudentBytes = 0;
  let avatarBytes = 0;
  let skillsBytes = 0;
  let otherBytes = 0;

  for (const s of students) {
    const sJson = JSON.stringify(s);
    const len = Buffer.byteLength(sJson, 'utf8');
    totalStudentBytes += len;
    const avLen = s.avatarUrl ? Buffer.byteLength(s.avatarUrl, 'utf8') : 0;
    avatarBytes += avLen;
    const skLen = Buffer.byteLength(JSON.stringify(s.skills), 'utf8');
    skillsBytes += skLen;
    otherBytes += (len - avLen - skLen);
  }

  console.log(`24 Students: Total=${(totalStudentBytes / 1024).toFixed(1)} KB | Avatars=${(avatarBytes / 1024).toFixed(1)} KB | Skills=${(skillsBytes / 1024).toFixed(1)} KB | Other=${(otherBytes / 1024).toFixed(1)} KB`);
  if (students.length > 0 && students[0].avatarUrl) {
    console.log(`Sample Student avatarUrl prefix: ${students[0].avatarUrl.slice(0, 50)} (length: ${students[0].avatarUrl.length})`);
  }

  console.log('\n--- DIAGNOSING MENTOR PAYLOADS ---');
  const mentors = await prisma.mentorProfile.findMany({ take: 24 });
  let totalMentorBytes = 0;
  let mAvatarBytes = 0;
  for (const m of mentors) {
    const mJson = JSON.stringify(m);
    const len = Buffer.byteLength(mJson, 'utf8');
    totalMentorBytes += len;
    const avLen = m.avatarUrl ? Buffer.byteLength(m.avatarUrl, 'utf8') : 0;
    mAvatarBytes += avLen;
  }
  console.log(`24 Mentors: Total=${(totalMentorBytes / 1024).toFixed(1)} KB | Avatars=${(mAvatarBytes / 1024).toFixed(1)} KB`);
  if (mentors.length > 0 && mentors[0].avatarUrl) {
    console.log(`Sample Mentor avatarUrl prefix: ${mentors[0].avatarUrl.slice(0, 50)} (length: ${mentors[0].avatarUrl.length})`);
  }
}

diagnose()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
