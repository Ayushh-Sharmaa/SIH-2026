"""Repairs logger imports placed inside multi-line import blocks.

The first codemod inserted after "the last line starting with `import `", which
lands *inside* a block like:

    import {
      Aurora,
    } from '@/components/motion';

This removes any misplaced line and re-inserts it after the true end of the
import section, tracking multi-line blocks properly.
"""

import io
import os
import re

ROOT = "src"
LOGGER_IMPORT = "import { logger } from '@/lib/logger';"

# An import statement ends on a line closing with a quoted module specifier.
IMPORT_END = re.compile(r"""^\s*\}?\s*from\s+['"][^'"]+['"];?\s*$""")
SINGLE_LINE_IMPORT = re.compile(r"""^import\s+.*from\s+['"][^'"]+['"];?\s*$""")
SIDE_EFFECT_IMPORT = re.compile(r"""^import\s+['"][^'"]+['"];?\s*$""")

fixed = []

for dirpath, _dirs, files in os.walk(ROOT):
    for name in files:
        if not name.endswith((".ts", ".tsx")):
            continue
        path = os.path.join(dirpath, name)
        source = io.open(path, encoding="utf-8").read()
        if LOGGER_IMPORT not in source:
            continue

        lines = source.split("\n")
        without = [line for line in lines if line.strip() != LOGGER_IMPORT.strip()]

        last_import_end = -1
        for index, line in enumerate(without):
            if (
                SINGLE_LINE_IMPORT.match(line)
                or SIDE_EFFECT_IMPORT.match(line)
                or IMPORT_END.match(line)
            ):
                last_import_end = index

        if last_import_end < 0:
            print("  !! no import section found:", path)
            continue

        without.insert(last_import_end + 1, LOGGER_IMPORT)
        repaired = "\n".join(without)
        if repaired != source:
            io.open(path, "w", encoding="utf-8").write(repaired)
            fixed.append(path)

for path in fixed:
    print("repaired", path)
print("files repaired:", len(fixed))
