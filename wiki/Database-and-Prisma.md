# Database & Prisma

This document details the PostgreSQL schema, Prisma ORM models, indexing strategies, relationships, and migration workflows for **SIH@GLBGOI**.

---

## 1. Entity Relationship Overview

```text
┌──────────────┐       1:1        ┌──────────────────┐
│     User     ├─────────────────►│  StudentProfile  │
│  (Auth Core) │                  └────────┬─────────┘
└──────┬───────┘                           │
       │ 1:1                               │ N:1
       ▼                                   ▼
┌──────────────┐                  ┌──────────────────┐       1:1        ┌─────────────────────┐
│MentorProfile │                  │       Team       ├─────────────────►│ TeamCodeReservation │
└──────┬───────┘                  └────────┬─────────┘                  └─────────────────────┘
       │                                   │
       │ N:1 (guidance)                    │ 1:N
       └───────────────────────────────────┤
                                           ├──► RecruitmentNotice
                                           ├──► TeamInvite
                                           ├──► JoinRequest
                                           └──► MentorRequest
```

---

## 2. Core Data Models

### `User`
The central authentication entity representing a registered student or mentor:
* `id` (`UUID`): Primary key.
* `email` (`String`, unique): Normalized lowercase institutional or whitelisted email.
* `role` (`Role` enum: `STUDENT`, `MENTOR`, `ADMIN`): System permission tier.
* `college` (`String`): Defaults to `GL Bajaj Group of Institutions, Mathura`.

### `StudentProfile`
Extended student profile information:
* `userId` (`String`, PK): Cascades on user deletion.
* `name`, `year`, `branch`, `rollNo`, `section`, `category`, `contact`.
* `skills` (`String[]`), `languages` (`String[]`), `softSkills` (`String[]`).
* `teamStatus` (`TeamStatus` enum: `OPEN`, `IN_TEAM`, `TEAM_FULL`).
* `isDemo` (`Boolean`): Flag for sandbox troubleshooting accounts.

### `MentorProfile`
Extended faculty mentor profile information:
* `userId` (`String`, PK): Cascades on user deletion.
* `name`, `designation`, `organization`, `expertise` (`String[]`).
* `verified` (`Boolean`): Verification badge flag.
* `registrationKey` (`String`): Single-use key used during onboarding.

### `Team`
Hackathon project team entity:
* `id` (`UUID`): Primary key.
* `teamCode` (`String`, unique): Human-readable public ID (e.g. `GLB100`).
* `name`, `trackId` (Primary Theme), `secondaryTrackId` (Secondary Theme).
* `leaderId` (`String`): Student user ID of the team leader.
* `status` (`String`): `forming`, `complete`, or `locked`.
* `mentorId` (`String?`): Foreign key to assigned `MentorProfile`.
* `memberCount` (`Int`, default: 1): Current enrolled student count (max 6).

### `TeamCodeReservation`
Immutable allocation ledger for team codes. When a team is created, its code is registered here. Deleting a team preserves the reservation row, guaranteeing that allocated codes are never re-used.

---

## 3. Indexes & Query Performance

The database enforces compound B-Tree indexes tailored to directory filter combinations:

| Model | Index Definition | Optimized Query Path |
| :--- | :--- | :--- |
| `StudentProfile` | `@@index([teamStatus, isDemo])` | Filters available candidates in Browse Teammates |
| `StudentProfile` | `@@index([branch, year])` | Department and academic year filters |
| `StudentProfile` | `@@index([teamId])` | Fast team roster membership resolution |
| `Team` | `@@index([trackId])` | Primary theme search in Browse Teams |
| `Team` | `@@index([status, memberCount])` | Open seat filtering (`status: 'forming'`) |
| `Team` | `@@index([mentorId])` | Dynamic mentor guided team count resolution |
| `TeamInvite` | `@@index([studentId, status])` | Student dashboard pending invitations query |
| `JoinRequest` | `@@index([teamId, status])` | Leader dashboard join requests query |
| `MentorRequest` | `@@index([mentorId, status])` | Mentor dashboard incoming inquiries query |

---

## 4. Query Patterns & Best Practices

### A. Explicit `select` Projections
API endpoints avoid `select *` or returning full entity graphs. Projections specify exact scalar fields needed for the client DTO, preventing over-fetching and protecting sensitive fields:

```typescript
const students = await prisma.studentProfile.findMany({
  where: filterConditions,
  take: 24,
  select: {
    userId: true,
    name: true,
    branch: true,
    year: true,
    skills: true,
    languages: true,
    softSkills: true,
    avatarUrl: true,
    teamStatus: true,
    trackInterest: { select: { problemStatementCode: true, name: true } },
  },
});
```

### B. Transactional Concurrency Protection
To prevent race conditions (such as two students claiming the 6th seat on a team simultaneously), seat acceptance runs inside interactive transactions (`prisma.$transaction`):

```typescript
await prisma.$transaction(async (tx) => {
  const team = await tx.team.findUnique({ where: { id: teamId } });
  if (team.memberCount >= 6) {
    throw new Error('Team is already full.');
  }

  await tx.studentProfile.update({
    where: { userId: studentId },
    data: { teamId, teamStatus: 'IN_TEAM' },
  });

  await tx.team.update({
    where: { id: teamId },
    data: {
      memberCount: { increment: 1 },
      status: team.memberCount + 1 >= 6 ? 'complete' : 'forming',
    },
  });
});
```

---

## 5. Migration Workflow

* **Development Migrations**:
  ```bash
  npx prisma migrate dev --name <migration_name>
  ```
* **Production Deployment**:
  ```bash
  npx prisma migrate deploy
  ```
* **Client Generation**:
  ```bash
  npx prisma generate
  ```

---

[← API Documentation](API-Documentation) • [Next: Performance Architecture →](Performance-Architecture)
