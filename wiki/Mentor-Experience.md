# Mentor Experience

This document describes the role, workflow, dashboard capabilities, and privacy boundaries for **Faculty Mentors** on SIH@GLBGOI.

---

## 1. Faculty Mentor Onboarding

Faculty members and appointed industry experts onboard with the `MENTOR` role:

1. **Sign in with Google OAuth**: Use `@glbajajgroup.org` or an administrator-whitelisted email.
2. **Select Mentor Role**: Choose the **Faculty Mentor** option during onboarding.
3. **Registration Key Validation**: Enter an issued `MentorRegistrationKey` (or department master key) to authorize the mentor role.
4. **Initial Profile**: Enter designation (e.g. Associate Professor, Assistant Professor, Department Lead) and academic department.

---

## 2. Mentor Dashboard (`/dashboard`)

The mentor dashboard provides a specialized control center for tracking assigned teams and reviewing student mentorship requests:

```text
┌────────────────────────────────────────────────────────────────────────┐
│  Dr. Rajesh Sharma                                   [Active Mentor]   │
│  Associate Professor, Computer Science & Engineering                   │
├────────────────────────────────┬───────────────────────────────────────┤
│  GUIDED TEAMS                  │  PENDING INQUIRIES                    │
│  3 Teams Active                │  2 Student Teams Requesting Guidance  │
└────────────────────────────────┴───────────────────────────────────────┘
```

* **Guidance Counter**: Derived dynamically from `Team.mentorId` — **there is no artificial limit on mentor capacity**. Mentors may guide as many teams as their schedule permits.
* **Assigned Team Space**: Full roster view of all teams currently guided by the mentor, including team code, problem statement, member names, and WhatsApp/communication links.
* **Mentorship Inquiry Queue**: Review incoming team mentorship applications.

---

## 3. Progressive Profile Management

Mentors manage their directory profile through three progressive tiles:

* **Section 1: Personal & Department (`PATCH /api/profile/mentor` with `section: 'personal'`)**: Name, designation, department/organization, and profile photo.
* **Section 2: Domain Expertise (`PATCH /api/profile/mentor` with `section: 'expertise'`)**: Technical and domain tags (e.g. AI/ML, MedTech, Computer Vision, Embedded Systems, Cloud Architecture).
* **Section 3: Professional Bio & Links (`PATCH /api/profile/mentor` with `section: 'bio'`)**: Bio, research areas, and LinkedIn profile URL.

---

## 4. Mentorship Request Workflow

```text
Team Leader Submits Inquiry (POST /api/mentor-requests)
                       │
                       ▼
Mentor Inquiries Queue (GET /api/dashboard/team-details)
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
      [Accept Request]    [Decline Request]
             │                   │
             ▼                   ▼
Atomic Assignment to Team    Notification Sent
(Team.mentorId = mentorId)
```

1. **Inquiry Submission**: A team leader selects a mentor in the **Browse Mentors** directory and submits an introductory message highlighting their project concept and guidance needs.
2. **Reviewing Inquiry**: The mentor evaluates the team's problem statement, required skills, and message in their dashboard.
3. **Atomic Acceptance**: When accepted, the system runs a PostgreSQL transaction that assigns `Team.mentorId = mentor.userId` and updates request status to `accepted`.

---

## 5. Privacy & Data Masking Boundaries

To protect student privacy and prevent unverified outreach:

* **Masked Student Contacts**: In pending mentorship inquiries, student roll numbers and phone numbers remain masked until the mentor accepts the inquiry.
* **Faculty Phone Privacy**: Faculty phone numbers are omitted from public `/api/mentors` search responses.

---

[← Student Experience](Student-Experience) • [Next: Team Formation →](Team-Formation)
