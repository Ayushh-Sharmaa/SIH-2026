# Search & Discovery

This document describes the unified **Search-First directory architecture**, database filtering, client-side debouncing, request cancellation, and caching strategies.

---

## 1. Unified Search-First Architecture

Both **Browse Teams** and **Browse Teammates** share an identical structural hierarchy designed to make search the primary visual and interaction focal point:

```text
DirectoryPage (Container width="wide")
│
├── DirectoryHero
│   ├── Eyebrow Tag ("Team directory" / "Talent directory")
│   ├── SplitText Heading ("Browse teams" / "Browse teammates")
│   ├── Description Subtitle
│   └── Live Stats Counter (Total Items Found & Active Filters)
│
├── DirectorySearchDeck (Elevated Command Deck)
│   ├── Header ("Search & Refine")
│   ├── Primary Search Bar (Large keyword input with instant clear button)
│   ├── Responsive Filter Grid (Custom parameter controls)
│   ├── Quick Suggestion Chips (Click-to-filter pills like + React, + Python)
│   └── Action Toolbar (Search / Apply & Reset buttons)
│
└── ResultsSection
    ├── DirectoryResultsBar (Results count & refreshing indicator)
    ├── Responsive Cards Grid (SpotlightCard & TiltCard depth)
    ├── DirectoryEmptyState (Unsearched Discovery, 0-Matches, Error Retry)
    └── DirectoryPagination (Bounded Previous / Next navigation)
```

---

## 2. Directory Configurations

### A. Browse Teams (`/team-formation/browse-teams`)
* **Primary Search**: Team name, problem statement, or track keyword.
* **Secondary Filters**:
  * *Tech Skill Needed*: e.g. Python, Figma, React
  * *Team Leader*: Leader name
  * *Domain (Category)*: Health, Agriculture, Education, Smart Vehicles, Security, Clean Water, Miscellaneous
  * *Team Size*: 1, 2, 3, 4, or 5 members
  * *Recruitment Status*: Open (forming) vs Closed / Full

### B. Browse Teammates (`/team-formation/browse-teammates`)
* **Primary Search**: Student name or keyword.
* **Secondary Filters**:
  * *Technical Skill*: e.g. React, Flutter, Python, PyTorch
  * *Theme Interest*: 17 SIH official themes (loaded from shared `sih_theme_list` cache)
  * *Department / Branch*: e.g. CSE, IT, AI/ML, ECE
  * *Year of Study*: 1st Year, 2nd Year, 3rd Year, 4th Year
  * *Soft Skill*: PPT Making, Technical Writing, UI/UX Design, Management
  * *Spoken Language*: English, Hindi

### C. Browse Mentors (`/team-formation/browse-mentors`)
* **Primary Search**: Mentor name or guided Team Code (e.g. `GLB100`).
* **Secondary Filters**: Domain expertise (e.g. AI/ML, Web Architecture, Embedded IoT).

---

## 3. Query Execution & Performance Guardrails

```text
User Input / Keystroke
         │
         ▼
300ms Client Debounce (Clears on next keypress)
         │
         ▼
AbortController.abort() (Cancels previous in-flight HTTP request)
         │
         ▼
QueryClient In-Memory Lookup (Returns cached payload if fresh)
         │ (Cache Miss)
         ▼
Backend API Route with Explicit `select` Projection & `take: 24`
         │
         ▼
Stale-Request Guard (requestId === latestRequestIdRef.current)
         │
         ▼
Hydrates UI & Updates Live Counter
```

* **Database-Side Filtering**: Filters run directly in PostgreSQL using Prisma compound `where` clauses, preventing massive data transfers to the browser.
* **Bounded Pagination**: All searches return a maximum of 24 records per page.
* **Stale-Response Protection**: Every search increments an internal `latestRequestIdRef`. Older responses returning out of order are discarded immediately.

---

## 4. Directory States

| State | Condition | Displayed Component |
| :--- | :--- | :--- |
| `UNSEARCHED_DISCOVERY_PROMPT` | Initial page mount before user query | Warm discovery prompt with popular search suggestion pills |
| `RESULTS_GRID` | Matching records found (`count > 0`) | Responsive grid of cards with results bar and pagination |
| `ZERO_MATCHES_EMPTY_STATE` | Search query returned 0 results | Clear empty state with "Reset All Filters" button |
| `ERROR_STATE` | Network or server error | Error alert card with "Retry Search" button |

---

[← Team Formation](Team-Formation) • [Next: Themes →](Themes)
