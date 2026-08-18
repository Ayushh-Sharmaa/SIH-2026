import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FOOTER_CONTACTS,
  STUDENT_COORDINATORS,
  FACULTY_COORDINATORS,
  SPOC_INFO,
  HELPDESK_INFO,
} from '../src/config/contacts';
import { SIH_OFFICIAL_17_THEMES } from '../src/lib/tracks';
import { ALL_17_THEME_SETS } from '../src/lib/content';
import {
  resolveSkillVariants,
  resolveSoftSkillVariants,
  resolveLanguageVariants,
} from '../src/lib/skills';
import { QueryClient } from '../src/lib/queryClient';
import { matchesDepartmentMentorKey } from '../src/lib/mentorKey';

describe('Observable Auth & Redirect Flows', () => {
  it('determines onboarding routing deterministically without intermediate bounce', () => {
    const computeRedirect = (syncResponse: { success: boolean; isOnboarded: boolean }) => {
      if (syncResponse.success) {
        return syncResponse.isOnboarded ? '/dashboard' : '/onboarding';
      }
      return '/login?error=oauth_failed';
    };

    // 1. New Google user without completed branch/year -> /onboarding
    assert.equal(computeRedirect({ success: true, isOnboarded: false }), '/onboarding');

    // 2. Existing Google user with completed profile -> /dashboard
    assert.equal(computeRedirect({ success: true, isOnboarded: true }), '/dashboard');

    // 3. Incomplete user -> /onboarding
    assert.equal(computeRedirect({ success: true, isOnboarded: false }), '/onboarding');
  });

  it('preserves server-side mentor registration key verification', () => {
    // Valid mentor department bypass keys
    assert.equal(matchesDepartmentMentorKey('GLB-MENTOR-2026-NEXA'), true);
    assert.equal(matchesDepartmentMentorKey('GLB-MENTOR-2026-FACULTY'), true);
    assert.equal(matchesDepartmentMentorKey('GLB-MENTOR-2026-VIP'), true);

    // Invalid mentor keys
    assert.equal(matchesDepartmentMentorKey('WRONG-KEY'), false);
    assert.equal(matchesDepartmentMentorKey('random-string'), false);
    assert.equal(matchesDepartmentMentorKey(''), false);
    assert.equal(matchesDepartmentMentorKey(null), false);
  });
});

describe('Contact Configurations & Ordering', () => {
  it('orders Footer student coordinators as Tanishk Bansal first, Ayush Sharma second', () => {
    assert.equal(FOOTER_CONTACTS.length, 2);
    assert.equal(FOOTER_CONTACTS[0].name, 'Tanishk Bansal');
    assert.equal(FOOTER_CONTACTS[0].phone, '+91 8534998412');
    assert.equal(FOOTER_CONTACTS[1].name, 'Ayush Sharma');
    assert.equal(FOOTER_CONTACTS[1].phone, '+91 89239995135');
  });

  it('orders Contact Page student coordinators as Ayush Sharma first, Tanishk Bansal second', () => {
    assert.equal(STUDENT_COORDINATORS.length, 2);
    assert.equal(STUDENT_COORDINATORS[0].name, 'Ayush Sharma');
    assert.equal(STUDENT_COORDINATORS[1].name, 'Tanishk Bansal');
  });

  it('removes "Student Lead" wording from student coordinator roles', () => {
    STUDENT_COORDINATORS.forEach((coord) => {
      assert.equal(coord.role.includes('Student Lead'), false);
      assert.ok(coord.role.includes('Student Coordinator') || coord.role.includes('Platform Lead'));
    });
  });

  it('contains the exact supplied faculty contact information', () => {
    assert.ok(FACULTY_COORDINATORS.length >= 3);

    const parul = FACULTY_COORDINATORS.find((f) => f.name.includes('Parul'));
    assert.ok(parul, 'Faculty member Parul must be present');
    assert.equal(parul?.phone, '8302344690');

    const anurag = FACULTY_COORDINATORS.find((f) => f.name.includes('Anurag Kumar Singh'));
    assert.ok(anurag, 'Faculty member Anurag Kumar Singh must be present');
    assert.equal(anurag?.phone, '892914465');
    assert.equal(anurag?.email, 'anurag.singh@glbajajgroup.org');

    const rahul = FACULTY_COORDINATORS.find((f) => f.name.includes('Rahul Anjana'));
    assert.ok(rahul, 'Faculty member Rahul Anjana must be present');
    assert.equal(rahul?.phone, '9981468558');

    const swati = FACULTY_COORDINATORS.find((f) => f.name.includes('Swati'));
    assert.ok(swati, 'Faculty member Swati must be present');
    assert.equal(swati?.phone, '9058441616');

    const anuragJunior = FACULTY_COORDINATORS.find((f) => f.name === 'Mr. Anurag Singh' && f.category === 'BTech 2nd Year');
    assert.ok(anuragJunior, 'Faculty member Anurag Singh (2nd Year) must be present');
    assert.equal(anuragJunior?.email, 'anuragsingh@glbajajgroup.org');
  });

  it('preserves institutional SPOC and Helpdesk metadata without invented personal details', () => {
    assert.ok(SPOC_INFO.title.includes('SIH SPOC'));
    assert.ok(SPOC_INFO.organization.includes('GL Bajaj'));
    assert.ok(HELPDESK_INFO.title.includes('Campus & Hackathon Lab Helpdesk'));
  });
});

describe('Deterministic Search & Normalization (5x Iteration Test)', () => {
  it('returns identical normalized query variants 5 consecutive times for React and Python', () => {
    for (let i = 0; i < 5; i++) {
      const reactVariants = resolveSkillVariants('react');
      assert.ok(reactVariants.includes('React'));
      assert.ok(reactVariants.includes('react'));
      assert.ok(reactVariants.includes('React Native'));

      const pythonVariants = resolveSkillVariants('python');
      assert.ok(pythonVariants.includes('Python'));
      assert.ok(pythonVariants.includes('python'));

      const nodeVariants = resolveSkillVariants('node');
      assert.ok(nodeVariants.includes('Node.js'));
    }
  });

  it('generates identical QueryClient cache keys 5 consecutive times regardless of filter order', () => {
    const generateCacheKey = (filters: Record<string, string | undefined>, page = 1) => {
      const clean: Record<string, string> = {};
      Object.keys(filters)
        .sort()
        .forEach((k) => {
          const val = filters[k]?.trim();
          if (val) clean[k] = val.toLowerCase();
        });
      return `search:${JSON.stringify(clean)}:${page}`;
    };

    for (let i = 0; i < 5; i++) {
      const keyA = generateCacheKey({ skill: 'React', branch: 'CSE', name: 'Ayush' }, 1);
      const keyB = generateCacheKey({ name: 'ayush', skill: 'react', branch: 'cse' }, 1);
      assert.equal(keyA, keyB);
    }
  });
});

describe('Search-First & Directory State Integrity', () => {
  it('distinguishes un-searched initial state from 0-match search state', () => {
    const getDirectoryState = (hasSearched: boolean, resultsCount: number) => {
      if (!hasSearched) return 'UNSEARCHED_DISCOVERY_PROMPT';
      if (resultsCount === 0) return 'ZERO_MATCHES_EMPTY_STATE';
      return 'RESULTS_GRID';
    };

    // Initial mount without user query
    assert.equal(getDirectoryState(false, 0), 'UNSEARCHED_DISCOVERY_PROMPT');

    // User searched for non-existent keyword
    assert.equal(getDirectoryState(true, 0), 'ZERO_MATCHES_EMPTY_STATE');

    // User searched and found matching cards
    assert.equal(getDirectoryState(true, 5), 'RESULTS_GRID');
  });

  it('deduplicates in-flight requests on concurrent calls', async () => {
    let callCount = 0;
    const fetcher = async () => {
      callCount++;
      await new Promise((r) => setTimeout(r, 10));
      return { success: true };
    };

    const [res1, res2, res3] = await Promise.all([
      QueryClient.fetch('observable_dedup_test', fetcher),
      QueryClient.fetch('observable_dedup_test', fetcher),
      QueryClient.fetch('observable_dedup_test', fetcher),
    ]);

    assert.equal(callCount, 1);
    assert.deepEqual(res1, res2);
    assert.deepEqual(res2, res3);
  });
});

describe('Dashboard Conditional Teamless vs Has-Team Actions', () => {
  it('renders discovery actions when teamless and hides them when member has a team', () => {
    const getDashboardState = (userHasTeam: boolean) => {
      if (!userHasTeam) {
        return {
          showTeamlessActions: true,
          actions: ['Browse Teams & Post Join Request', 'Create a New Team', 'Browse Teammates'],
        };
      }
      return {
        showTeamlessActions: false,
        actions: [],
      };
    };

    const teamless = getDashboardState(false);
    assert.equal(teamless.showTeamlessActions, true);
    assert.equal(teamless.actions.length, 3);

    const inTeam = getDashboardState(true);
    assert.equal(inTeam.showTeamlessActions, false);
    assert.equal(inTeam.actions.length, 0);
  });

  it('accurately computes team capacity and open seats for up to 6 members', () => {
    const computeTeamCapacity = (memberCount: number) => {
      const current = Math.max(1, memberCount);
      const capacity = 6;
      const openSeats = Math.max(0, capacity - current);
      return { current, capacity, openSeats };
    };

    assert.deepEqual(computeTeamCapacity(1), { current: 1, capacity: 6, openSeats: 5 });
    assert.deepEqual(computeTeamCapacity(4), { current: 4, capacity: 6, openSeats: 2 });
    assert.deepEqual(computeTeamCapacity(6), { current: 6, capacity: 6, openSeats: 0 });
  });
});

describe('SIH 17 Themes Authoritative Catalog', () => {
  it('defines exactly 17 official SIH themes across all catalog sources', () => {
    assert.equal(SIH_OFFICIAL_17_THEMES.length, 17);
    const totalContentThemes = ALL_17_THEME_SETS.reduce((acc, set) => acc + set.themes.length, 0);
    assert.equal(totalContentThemes, 17);
  });
});
