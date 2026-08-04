"""Resolves the in-progress merge, hunk by hunk, with explicit choices.

Context: both branches independently fixed the same `catch (err: any)` sites.
This side introduced `userFacingMessage`; the other used `err instanceof Error`.
`userFacingMessage` is a superset (handles non-Error throws, refuses text that
looks internal), so it wins everywhere the hunk is only about that.

The exception is the first hunk of each auth page, where the OTHER side is the
security fix and must win: this side still carried a Google-sign-in error
fallback that POSTed a hardcoded super-admin address to /api/auth/clerk-sync,
signing the caller in as that account with no password. Those hunks take the
incoming body, with only the error-surfacing line upgraded.

'head'      keep this branch's side
'incoming'  keep the other branch's side
(str)       replace the whole hunk with this literal text
"""

import io
import re
import sys

CONFLICT = re.compile(
    r"^<<<<<<< [^\n]*\n(?P<head>.*?)^=======\n(?P<incoming>.*?)^>>>>>>> [^\n]*\n",
    re.S | re.M,
)

LOGIN_GOOGLE = """
      await clerk.client.signIn.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/api/auth/clerk-sync',
      });
    } catch (err) {
      logger.error('Google Sign-In error', err);
      setError(userFacingMessage(err, 'Google Sign-In failed. Please try again.'));
"""

SIGNUP_GOOGLE = """
      await clerk.client.signUp.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: '/api/auth/clerk-sync',
      });
    } catch (err) {
      logger.error('Google Sign-Up error', err);
      setError(userFacingMessage(err, 'Google Sign-Up failed. Please try again.'));
"""

# session.tsx: union — this side's `isViewingAs` plus the other side's `clear`
# dependency, which is correct for exhaustive-deps even though `clear` is stable.
SESSION_MEMO = """    () => ({ user, status, isViewingAs, refresh: load, clear }),
    [user, status, isViewingAs, load, clear],
"""

PLAN = {
    "src/app/(auth)/login/page.tsx": [LOGIN_GOOGLE, "head", "head", "head"],
    "src/app/(auth)/signup/page.tsx": [SIGNUP_GOOGLE, "head", "head", "head"],
    "src/app/admin/page.tsx": ["head"] * 7,
    "src/app/api/auth/clerk-sync/route.ts": ["head"],
    "src/app/onboarding/page.tsx": ["head", "head"],
    "src/app/team-formation/create-team/page.tsx": ["head"],
    "src/components/layout/ViewingAsBanner.tsx": ["head"],
    "src/lib/session.tsx": [SESSION_MEMO],
}

failed = False

for path, choices in PLAN.items():
    source = io.open(path, encoding="utf-8").read()
    hunks = list(CONFLICT.finditer(source))

    if len(hunks) != len(choices):
        print(
            "MISMATCH %s: file has %d hunk(s), plan has %d"
            % (path, len(hunks), len(choices))
        )
        failed = True
        continue

    # Rebuild back-to-front so earlier offsets stay valid.
    out = source
    for match, choice in zip(reversed(hunks), reversed(choices)):
        if choice == "head":
            replacement = match.group("head")
        elif choice == "incoming":
            replacement = match.group("incoming")
        else:
            replacement = choice
        out = out[: match.start()] + replacement + out[match.end() :]

    io.open(path, "w", encoding="utf-8").write(out)
    print("resolved %-50s %d hunk(s)" % (path, len(choices)))

sys.exit(1 if failed else 0)
