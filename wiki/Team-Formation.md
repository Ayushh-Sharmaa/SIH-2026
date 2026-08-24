# Team Formation

This document details the team lifecycle, capacity rules, recruitment notices, invitations, and join requests on SIH@GLBGOI.

---

## 1. Team Formation Lifecycle

```text
Create Team (Leader) ──► Post Recruitment Notices ──► Send Invites / Review Join Requests ──► Team Full (6 Members) ──► Request Faculty Mentor
```

---

## 2. Creating a Team (`POST /api/teams`)

When a student creates a team:
1. **Team Name & Code**: The leader provides a team name. The system assigns a human-readable team code (e.g. `GLB100`).
2. **Immutable Code Ledger (`TeamCodeReservation`)**:
   * Every allocated team code is recorded in `TeamCodeReservation`.
   * Even if a team is later disbanded or deleted, its code remains permanently retired and can never be re-allocated or collided.
3. **Problem Statement Selection**: The team selects a **Primary Theme** from the 17 official SIH themes (and an optional **Secondary Theme**).
4. **Leader Role**: The creating student becomes the `Leader` and occupies seat 1 of 6.

---

## 3. Team Capacity & Roster Rules

* **Strict 6-Member Cap**: An SIH team consists of exactly 6 student members (1 Leader + 5 Members).
* **Open Seats Calculation**:
  $$\text{Open Seats} = \max(0, 6 - \text{Current Member Count})$$
* **Status Flags**:
  * `forming`: Team is actively seeking members (`memberCount < 6`).
  * `complete`: Team roster has reached 6 members (`memberCount = 6`).
  * `locked`: Team leader manually locked roster.
* **Auto-Recalculation**: If a member leaves or is removed, `memberCount` automatically decrements and the team status returns to `forming`.

---

## 4. Recruitment Notices (`RecruitmentNotice`)

Team leaders can publish specific open-seat notices displayed on their team cards across the **Browse Teams** directory:

```json
{
  "role": "Frontend / React Developer",
  "gender": "FEMALE",
  "abilities": ["React", "Tailwind CSS", "Figma"],
  "requirements": "Looking for a 2nd/3rd year student to design our clean UI."
}
```

* **Gender Tag**: `MALE`, `FEMALE`, or `OPEN` (supports SIH team composition diversity rules).
* **Abilities**: Tagged technical skills sought for the role.
* **Requirements**: Free-form project description.

---

## 5. Joining & Inviting Workflows

### Join Requests (`JoinRequest`)
1. A student browsing teams clicks **Join Team** on an open team card.
2. The student submits an optional introductory message in the modal (`POST /api/join-requests`).
3. The team leader reviews the request in their dashboard.
4. On acceptance, a PostgreSQL transaction validates available capacity, adds the student to `Team.members`, increments `memberCount`, and marks the request `accepted`.

### Team Invitations (`TeamInvite`)
1. A team leader browsing student profiles clicks **Invite to Team** (`POST /api/team-invites`).
2. The candidate student receives an invite notification in their dashboard.
3. On acceptance, the transaction updates the student's `teamStatus = IN_TEAM` and enrolls them into the team roster.

---

## 6. Role & Permission Matrix

| Action | Team Leader | Team Member | Non-Member |
| :--- | :---: | :---: | :---: |
| Edit Team Details & WhatsApp link | ✅ | ❌ | ❌ |
| Post Recruitment Notices | ✅ | ❌ | ❌ |
| Send Team Invites to Students | ✅ | ❌ | ❌ |
| Accept / Decline Join Requests | ✅ | ❌ | ❌ |
| Request Faculty Mentorship | ✅ | ❌ | ❌ |
| View Team Space & Roster | ✅ | ✅ | ❌ |
| Leave Team | ❌ *(Must disband or transfer)* | ✅ | ❌ |
| Submit Join Request | ❌ | ❌ | ✅ *(If teamless)* |

---

[← Mentor Experience](Mentor-Experience) • [Next: Search & Discovery →](Search-and-Discovery)
