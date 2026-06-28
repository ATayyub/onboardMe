#!/bin/bash
# PreToolUse guard: blocks destructive DB operations (ADR-001)
# Exit code 2 = block the tool call and show stderr as the reason.

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('command', ''))
" 2>/dev/null || echo "")

# Skip git commands entirely — commit messages may reference these terms in docs
if echo "$CMD" | grep -qE "^\s*git "; then
    exit 0
fi

# Block prisma commands that bypass migration history
if echo "$CMD" | grep -qiE "prisma migrate reset|prisma db push"; then
    MATCHED=$(echo "$CMD" | grep -oiE "prisma migrate reset|prisma db push" | head -1)
    echo "BLOCKED: '$MATCHED' is forbidden — see ADR-001 in decision.md" >&2
    echo "flow_versions must remain append-only. Never reset or drop DB tables." >&2
    exit 2
fi

# Block raw SQL destructive statements (only when a DB client is also in the command)
if echo "$CMD" | grep -qiE "psql|mysql|sqlite" && echo "$CMD" | grep -qiE "DROP TABLE|TRUNCATE TABLE|DROP DATABASE"; then
    MATCHED=$(echo "$CMD" | grep -oiE "DROP TABLE|TRUNCATE TABLE|DROP DATABASE" | head -1)
    echo "BLOCKED: '$MATCHED' in a DB client command — see ADR-001 in decision.md" >&2
    exit 2
fi

exit 0
