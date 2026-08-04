"""One-shot codemod: console.error(...) -> logger.error(...).

Kept in the repo only until the migration is verified; delete afterwards.
Matches the two shapes actually present in this codebase:
    console.error('message:', err)
    console.error('message')
Anything else is left alone and reported, so nothing is silently mangled.
"""

import io
import os
import re

ROOT = "src"
LOGGER_PATH_SUFFIX = "src/lib/logger.ts"

SIMPLE = re.compile(
    r"console\.error\(\s*(['\"])(.*?)\1(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)"
)
ANY_CONSOLE_ERROR = re.compile(r"console\.error\(")

changed = []
skipped = []

for dirpath, _dirs, files in os.walk(ROOT):
    for name in files:
        if not name.endswith((".ts", ".tsx")):
            continue
        path = os.path.join(dirpath, name)
        normalised = path.replace(os.sep, "/")
        if normalised.endswith(LOGGER_PATH_SUFFIX):
            continue  # its console.error IS the development sink

        source = io.open(path, encoding="utf-8").read()
        if "console.error" not in source:
            continue

        def replace(match):
            message = match.group(2).rstrip().rstrip(":")
            error = match.group(3)
            message = message.replace("'", "\\'")
            return "logger.error('%s'%s)" % (message, (", " + error) if error else "")

        updated, count = SIMPLE.subn(replace, source)
        if count == 0:
            skipped.append(path)
            continue

        remaining = len(ANY_CONSOLE_ERROR.findall(updated))
        if remaining:
            skipped.append("%s (%d unmatched form left)" % (path, remaining))

        if "from '@/lib/logger'" not in updated:
            lines = updated.split("\n")
            last_import = max(
                (i for i, line in enumerate(lines) if line.startswith("import ")),
                default=-1,
            )
            if last_import >= 0:
                lines.insert(last_import + 1, "import { logger } from '@/lib/logger';")
                updated = "\n".join(lines)
            else:
                skipped.append("%s (no import block found)" % path)
                continue

        io.open(path, "w", encoding="utf-8").write(updated)
        changed.append((path, count))

for path, count in changed:
    print(count, path)
print("files changed:", len(changed), "sites:", sum(c for _, c in changed))
if skipped:
    print("NEEDS MANUAL REVIEW:")
    for item in skipped:
        print("  ", item)
