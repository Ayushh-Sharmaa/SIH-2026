import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { adminPortalAccessSchema } from '../src/lib/validation';
import { isAllowedCollegeEmail } from '../src/lib/auth';
import { isSuperAdmin, stripAdminSuffix } from '../src/lib/admin';

describe('Portal Access Whitelist Validation & Security Boundary', () => {
  test('validates adding a student whitelist entry', () => {
    const res = adminPortalAccessSchema.safeParse({
      email: 'external.student@gmail.com',
      action: 'add',
      role: 'STUDENT',
      note: 'External hackathon candidate',
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.email, 'external.student@gmail.com');
      assert.equal(res.data.role, 'STUDENT');
      assert.equal(res.data.action, 'add');
    }
  });

  test('validates adding a mentor whitelist entry', () => {
    const res = adminPortalAccessSchema.safeParse({
      email: 'industry.expert@outlook.com',
      action: 'add',
      role: 'MENTOR',
      note: 'Guest industry mentor',
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.role, 'MENTOR');
    }
  });

  test('validates role switching and removal', () => {
    const updateRes = adminPortalAccessSchema.safeParse({
      email: 'guest@gmail.com',
      action: 'update_role',
      role: 'MENTOR',
    });
    assert.equal(updateRes.success, true);

    const removeRes = adminPortalAccessSchema.safeParse({
      email: 'guest@gmail.com',
      action: 'remove',
    });
    assert.equal(removeRes.success, true);
  });

  test('rejects invalid emails and unknown actions', () => {
    const invalidEmail = adminPortalAccessSchema.safeParse({
      email: 'not-an-email',
      action: 'add',
    });
    assert.equal(invalidEmail.success, false);

    const invalidAction = adminPortalAccessSchema.safeParse({
      email: 'valid@gmail.com',
      action: 'invalid_action',
    });
    assert.equal(invalidAction.success, false);
  });

  test('enforces strict boundary between college domain and external domain', () => {
    assert.equal(isAllowedCollegeEmail('student@glbajajgroup.org'), true);
    assert.equal(isAllowedCollegeEmail('faculty@glbajajgroup.org'), true);
    assert.equal(isAllowedCollegeEmail('guest@gmail.com'), false);
    assert.equal(isAllowedCollegeEmail('mentor@yahoo.com'), false);
  });

  test('guarantees portal whitelist does NOT grant superadmin privileges', () => {
    assert.equal(isSuperAdmin('external.user@gmail.com'), false);
    assert.equal(isSuperAdmin('external.user@gmail.com/admin'), false);
    assert.equal(stripAdminSuffix('external.user@gmail.com/admin'), 'external.user@gmail.com');
  });
});
