# Student Experience

This guide documents the student journey through SIH@GLBGOI, from profile onboarding and skill tagging to team formation and mentorship requests.

---

## 1. Student Dashboard (`/dashboard`)

The student dashboard serves as the central mission control for hackathon participants:

* **Identity Banner**: Displays student name, academic department, study year, and avatar with immediate completion score.
* **Profile Completion Status**: Visual progress indicator highlighting incomplete profile sections.
* **Team Space**: Dynamic workspace reflecting whether the student is currently looking for a team or leading/participating in an active roster.
* **Quick Action Controls**: Fast navigation to Browse Teams, Find Teammates, and Browse Mentors.

---

## 2. Progressive Profile Completion

Student profiles are updated through three focused, independent mutation tiles rather than a single monolithic form:

### Tile 1: Personal & Academic Information (`PATCH /api/profile/personal`)
* **Full Name**: Legal name used for official SIH team registration.
* **Branch / Department**: Academic branch (e.g. CSE, IT, AI/ML, ECE, ME).
* **Year of Study**: 1st Year, 2nd Year, 3rd Year, or 4th Year.
* **College Roll Number**: Student identification number.
* **Class Section**: Academic section (A through I).
* **Social Category**: General, OBC, SC, ST (required for SIH institutional compliance).
* **Contact Phone**: 10-digit mobile number for team communication (masked in public searches).
* **Profile Photo**: Uploaded raster avatar (streamed via binary image endpoint).

### Tile 2: Technical Skills & Fluency (`PATCH /api/profile/skills`)
* **Technical Skills**: Multi-tag skill selection (e.g. React, Python, Node.js, PyTorch, Flutter, Figma).
* **Soft Skills**: Collaboration proficiencies (e.g. PPT Making, Technical Writing, UI/UX Design, Management).
* **Spoken Languages**: Languages spoken for team communication (e.g. English, Hindi).

### Tile 3: Themes & External Links (`PATCH /api/profile/themes`)
* **Theme Interests**: Select from the 17 official SIH problem statement themes.
* **GitHub URL**: Developer profile link for code review.
* **LinkedIn URL**: Professional profile link.
* **Resume URL**: Link to portfolio or PDF resume.

---

## 3. Team Space States

The student dashboard intelligently adapts based on team membership status:

### Teamless State (`teamStatus: OPEN`)
When a student is not yet part of any team, the dashboard presents:
* **"Create a Team" Callout**: Direct flow to register a new team and become Team Leader.
* **"Browse Forming Teams"**: Direct access to find teams with open seats matching the student's skills.
* **"Pending Invitations"**: Review invitations received from team leaders.
* **"Submitted Join Requests"**: Track status of join requests sent to existing teams.

### In-Team State (`teamStatus: IN_TEAM` or `TEAM_FULL`)
When a student is enrolled in a team, the dashboard renders the active team card:
* **Team Name & Code**: Team identifier (e.g. `GLB100`).
* **Problem Statement Track**: Primary and secondary SIH themes.
* **Roster Dial**: Interactive avatars for up to 6 members, showing roles (Leader, Member).
* **Recruitment Notices**: Current active open-seat roles and requirements.
* **Mentorship Card**: Assigned faculty mentor profile and guidance status.
* **Leave / Disband Actions**: Safe exit flows with confirmation dialogs.

---

## 4. Discovery Hubs

From the student dashboard, students can navigate between three search-first discovery directories:

1. **[Browse Teams](Team-Formation)**: Search forming teams by required skills, domain categories, leader name, and open seats.
2. **[Browse Teammates](Search-and-Discovery)**: Find collaborating students with complementary skill stacks.
3. **[Browse Mentors](Mentor-Experience)**: Explore verified faculty mentors and submit mentorship requests.

---

[← Auth & Onboarding](Authentication-and-Onboarding) • [Next: Mentor Experience →](Mentor-Experience)
