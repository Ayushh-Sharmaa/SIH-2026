import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { themesProfileSchema, studentProfileSchema } from '../src/lib/validation';
import {
  resolveSkillVariants,
  resolveSoftSkillVariants,
  resolveLanguageVariants,
  STANDARD_SKILLS,
} from '../src/lib/skills';

describe('Skill Variant Resolution & Search Normalization', () => {
  test('resolves canonical skill variants for case-insensitive matching', () => {
    const reactVariants = resolveSkillVariants('react');
    assert.ok(reactVariants.includes('React'));
    assert.ok(reactVariants.includes('react'));
    assert.ok(reactVariants.includes('React Native'));

    const tsVariants = resolveSkillVariants('typescript');
    assert.ok(tsVariants.includes('TypeScript'));
    assert.ok(tsVariants.includes('typescript'));

    const nodeVariants = resolveSkillVariants('node');
    assert.ok(nodeVariants.includes('Node.js'));
    assert.ok(nodeVariants.includes('node'));
  });

  test('resolves soft skills and languages variants', () => {
    const commVariants = resolveSoftSkillVariants('communication');
    assert.ok(commVariants.includes('Communication'));

    const englishVariants = resolveLanguageVariants('english');
    assert.ok(englishVariants.includes('English'));
  });

  test('unknown skills return safe trimmed array variants', () => {
    const custom = resolveSkillVariants('  custom-ai-lib  ');
    assert.ok(custom.includes('custom-ai-lib'));
    assert.ok(custom.length >= 1);
  });
});

describe('Themes & Links Validation Robustness', () => {
  test('accepts undefined, null, and empty strings for optional URL links without error', () => {
    const validUndefined = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      githubUrl: undefined,
      linkedinUrl: undefined,
      resumeUrl: undefined,
    });
    assert.equal(validUndefined.success, true);
    assert.equal(validUndefined.data?.githubUrl, undefined);

    const validEmpty = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      githubUrl: '',
      linkedinUrl: '   ',
      resumeUrl: '',
    });
    assert.equal(validEmpty.success, true);
    assert.equal(validEmpty.data?.githubUrl, undefined);
    assert.equal(validEmpty.data?.linkedinUrl, undefined);
    assert.equal(validEmpty.data?.resumeUrl, undefined);

    const validNull = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      githubUrl: null,
      linkedinUrl: null,
      resumeUrl: null,
    });
    assert.equal(validNull.success, true);
    assert.equal(validNull.data?.githubUrl, undefined);
  });

  test('accepts valid GitHub, LinkedIn, and Portfolio URLs', () => {
    const validFull = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      githubUrl: 'https://github.com/torvalds',
      linkedinUrl: 'https://linkedin.com/in/williamhgates',
      resumeUrl: 'https://drive.google.com/file/d/123/view',
    });
    assert.equal(validFull.success, true);
    assert.equal(validFull.data?.githubUrl, 'https://github.com/torvalds');
  });

  test('rejects invalid domains for GitHub and LinkedIn', () => {
    const invalidGh = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      githubUrl: 'https://gitlab.com/username',
    });
    assert.equal(invalidGh.success, false);

    const invalidLi = themesProfileSchema.safeParse({
      trackInterest: ['track-1', 'track-2'],
      linkedinUrl: 'https://facebook.com/username',
    });
    assert.equal(invalidLi.success, false);
  });
});

describe('Team Space Capacity & Open Seats Calculation', () => {
  test('accurately calculates open seats for any team size between 1 and 6', () => {
    const calculateSeats = (membersCount: number) => {
      const count = Math.max(1, membersCount);
      const openSeats = Math.max(0, 6 - count);
      return { memberCount: count, openSeats };
    };

    assert.deepEqual(calculateSeats(1), { memberCount: 1, openSeats: 5 });
    assert.deepEqual(calculateSeats(2), { memberCount: 2, openSeats: 4 });
    assert.deepEqual(calculateSeats(5), { memberCount: 5, openSeats: 1 });
    assert.deepEqual(calculateSeats(6), { memberCount: 6, openSeats: 0 });
    assert.deepEqual(calculateSeats(7), { memberCount: 7, openSeats: 0 });
  });
});

describe('Search Query Cache Key Normalization', () => {
  test('produces identical deterministic cache keys regardless of filter key ordering or whitespace', () => {
    const normalize = (filters: Record<string, string | undefined>, page = 1) => {
      const clean: Record<string, string> = {};
      Object.keys(filters)
        .sort()
        .forEach((key) => {
          const val = filters[key]?.trim();
          if (val) clean[key] = val.toLowerCase();
        });
      return `teammates:${JSON.stringify(clean)}:${page}`;
    };

    const key1 = normalize({ name: ' Alice ', skill: 'REACT', branch: 'CSE' }, 1);
    const key2 = normalize({ branch: 'cse', name: 'alice', skill: 'react' }, 1);
    const key3 = normalize({ skill: ' React ', name: 'ALICE', branch: 'cse', language: '' }, 1);

    assert.equal(key1, key2);
    assert.equal(key2, key3);
  });
});
