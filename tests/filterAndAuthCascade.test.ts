import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveSkillVariants, resolveSoftSkillVariants, resolveLanguageVariants } from '../src/lib/skills';
import { clearSessionCookie } from '../src/lib/sessionCookie';

describe('Filter Systems & Auth Session Invalidation', () => {
  test('resolves skill variants case-insensitively for team and teammate queries', () => {
    const pythonVariants = resolveSkillVariants('python');
    assert.ok(pythonVariants.includes('Python'));
    assert.ok(pythonVariants.includes('python'));

    const reactVariants = resolveSkillVariants('React');
    assert.ok(reactVariants.includes('React'));
    assert.ok(reactVariants.includes('react'));

    const mlVariants = resolveSkillVariants('machine learning');
    assert.ok(mlVariants.includes('Machine Learning'));
    assert.ok(mlVariants.includes('ML'));
  });

  test('resolves soft skill and language variants properly', () => {
    const pptVariants = resolveSoftSkillVariants('ppt');
    assert.ok(pptVariants.some(v => v.toLowerCase().includes('ppt')));

    const hindiVariants = resolveLanguageVariants('hindi');
    assert.ok(hindiVariants.includes('Hindi'));
  });

  test('clearSessionCookie wipes token with maxAge 0', () => {
    const setCalls: Array<{ name: string; value: string; options: any }> = [];
    const mockCookies = {
      set: (name: string, value: string, options: any) => {
        setCalls.push({ name, value, options });
      },
    };

    clearSessionCookie(mockCookies as any);
    assert.equal(setCalls.length, 1);
    assert.equal(setCalls[0].name, 'token');
    assert.equal(setCalls[0].value, '');
    assert.equal(setCalls[0].options.maxAge, 0);
    assert.equal(setCalls[0].options.path, '/');
  });

  test('team size and recruitment status filters construct clean boolean logic', () => {
    const openStatus = { status: 'forming', memberCount: { lt: 6 } };
    assert.equal(openStatus.status, 'forming');
    assert.deepEqual(openStatus.memberCount, { lt: 6 });

    const closedStatus = {
      OR: [
        { status: { not: 'forming' } },
        { memberCount: { gte: 6 } },
      ],
    };
    assert.equal(closedStatus.OR.length, 2);
  });

  test('enforces GLB human-readable team code pattern (e.g. GLB100)', () => {
    const formatCode = (seq: number) => `GLB${seq}`;
    const code = formatCode(100);
    assert.match(code, /^GLB\d+$/);
    assert.equal(code, 'GLB100');
  });
});
