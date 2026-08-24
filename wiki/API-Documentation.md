# API Documentation

This document provides a complete reference for all REST API endpoints, authorization rules, payload schemas, and rate limits in **SIH@GLBGOI**.

---

## 1. Authentication Endpoints

### `POST /api/auth/clerk-sync`
* **Purpose**: Bridges Clerk OAuth session with backend PostgreSQL database and mints first-party session JWT.
* **Auth Requirement**: Active Clerk session.
* **Input**: None (reads Clerk session headers).
* **Output**: `{ success: boolean, isOnboarded: boolean, user: UserDTO }`
* **Rate Limit**: 20 requests / 10 min / IP.

### `POST /api/auth/login`
* **Purpose**: Email/password authentication fallback (and sandbox developer access).
* **Input**: `{ email: string, password: string }`
* **Output**: `{ success: boolean, user: UserDTO }`
* **Rate Limit**: 5 consecutive failures / 10 min (exponential backoff).

### `POST /api/auth/logout`
* **Purpose**: Clears first-party HTTP-only session cookie.
* **Output**: `{ success: boolean }`

### `GET /api/auth/me`
* **Purpose**: Fetches active session user identity.
* **Auth Requirement**: Authenticated session cookie.
* **Output**: `{ success: boolean, user: UserDTO }`

---

## 2. Dashboard Endpoints

### `GET /api/dashboard/bootstrap`
* **Purpose**: Stage 1 fast user bootstrap (< 100ms response). Returns identity, role, and profile completion state.
* **Auth Requirement**: Authenticated user.
* **Output**: `{ success: boolean, user: { userId, name, email, role, avatarUrl, completion } }`
* **Rate Limit**: 60 requests / min.

### `GET /api/dashboard/team-details`
* **Purpose**: Stage 2 parallel relationship loader. Fetches team roster, invitations, join requests, and mentorship status.
* **Auth Requirement**: Authenticated user.
* **Output**: `{ success: boolean, team: TeamDTO, invites: InviteDTO[], requests: RequestDTO[] }`
* **Privacy Rule**: Masks student phone numbers in pending mentorship inquiries until accepted.

---

## 3. Profile Mutation Endpoints

### `PATCH /api/profile/personal`
* **Purpose**: Updates student personal and academic information (Tile 1).
* **Role**: `STUDENT`
* **Input**: `{ name, branch, year, rollNo, section, category, contact, avatarUrl }`
* **Output**: `{ success: boolean, profile: StudentProfileDTO }`

### `PATCH /api/profile/skills`
* **Purpose**: Updates student technical and soft skills (Tile 2).
* **Role**: `STUDENT`
* **Input**: `{ skills: string[], languages: string[], softSkills: string[] }`
* **Output**: `{ success: boolean, profile: StudentProfileDTO }`

### `PATCH /api/profile/themes`
* **Purpose**: Updates student SIH theme interests and external links (Tile 3).
* **Role**: `STUDENT`
* **Input**: `{ trackIds: string[], githubUrl, linkedinUrl, resumeUrl }`
* **Output**: `{ success: boolean, profile: StudentProfileDTO }`

### `PATCH /api/profile/mentor`
* **Purpose**: Updates faculty mentor profile tiles.
* **Role**: `MENTOR`
* **Input**: `{ section: 'personal' | 'expertise' | 'bio', data: Record<string, any> }`
* **Output**: `{ success: boolean, profile: MentorProfileDTO }`

---

## 4. Directory Search Endpoints

### `GET /api/teams`
* **Purpose**: Search forming and active hackathon teams with bounded pagination.
* **Query Parameters**:
  * `search`: Keyword string (name, track, technology)
  * `domain`: Theme category filter
  * `skill`: Technical skill needed
  * `leader`: Leader name
  * `size`: Team member count (1-5)
  * `status`: `open` or `closed`
  * `page`: Page number (bounded `take: 24`)
* **Output**: `{ success: boolean, teams: TeamCardDTO[], pagination: { total, totalPages, page }, viewer: { hasTeam } }`
* **Rate Limit**: 60 requests / min.

### `GET /api/students`
* **Purpose**: Search available participating students for team recruitment.
* **Query Parameters**: `name`, `college`, `branch`, `year`, `skill`, `softSkill`, `language`, `trackId`, `page`
* **Output**: `{ success: boolean, students: StudentCardDTO[], pagination: { total, totalPages } }`
* **Privacy Rule**: Strictly excludes roll numbers (`rollNo`) and phone contacts (`contact`).
* **Rate Limit**: 60 requests / min.

### `GET /api/mentors`
* **Purpose**: Directory of verified faculty mentors.
* **Query Parameters**: `name`, `expertise`, `page`
* **Output**: `{ success: boolean, mentors: MentorCardDTO[], eligibility: { canRequest } }`
* **Privacy Rule**: Masks private faculty phone contacts.

---

## 5. Team Lifecycle & Request Endpoints

### `POST /api/teams`
* **Purpose**: Creates a new team and registers team code in immutable reservation ledger.
* **Role**: `STUDENT` (must not already belong to a team)
* **Input**: `{ name, trackId, secondaryTrackId?, skillsCovered?, whatsapp? }`
* **Output**: `{ success: boolean, teamId: string, teamCode: string }`

### `POST /api/join-requests`
* **Purpose**: Submits a request to join an open forming team.
* **Input**: `{ teamId: string, message?: string }`
* **Output**: `{ success: boolean, requestId: string }`

### `POST /api/team-invites`
* **Purpose**: Team leader invites candidate student to join their roster.
* **Role**: `STUDENT` (must be Team Leader)
* **Input**: `{ studentId: string }`
* **Output**: `{ success: boolean, inviteId: string }`

### `POST /api/mentor-requests`
* **Purpose**: Team leader requests faculty mentorship.
* **Role**: `STUDENT` (must be Team Leader)
* **Input**: `{ mentorId: string, message?: string }`
* **Output**: `{ success: boolean, requestId: string }`

---

## 6. Binary Avatar Streaming Endpoint

### `GET /api/avatar/[userId]`
* **Purpose**: Streams raw binary avatar image with immutable cache headers.
* **Security Guardrails**:
  * Validates `userId` against `/^[a-zA-Z0-9_-]{1,64}$/` to block traversal.
  * Enforces MIME allowlist (`image/jpeg`, `image/png`, `image/webp`, `image/gif`).
  * 500 KB byte ceiling.
  * Rate limit: 120 requests / min / IP.
* **Cache Header**: `Cache-Control: public, max-age=86400, stale-while-revalidate=604800, immutable`

---

## 7. Themes Catalog Endpoint

### `GET /api/tracks`
* **Purpose**: Returns the 17 official SIH themes.
* **Output**: `{ success: boolean, tracks: TrackDTO[] }`
* **Client Cache**: Cached in `QueryClient` under `sih_theme_list` (5-minute TTL).

---

[← Themes](Themes) • [Next: Database & Prisma →](Database-and-Prisma)
