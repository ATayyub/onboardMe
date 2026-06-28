#!/bin/bash
# PostToolUse: logs every Bash command to session-commands.log (gitignored)

INPUT=$(cat)
CMD=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
cmd = d.get('tool_input', {}).get('command', '')
# Truncate at 300 chars and collapse newlines so each entry is one line
print(cmd[:300].replace('\n', ' ↵ '))
" 2>/dev/null || echo "")

echo "[$(date '+%Y-%m-%d %H:%M')] CMD: $CMD" >> session-commands.log 2>/dev/null
exit 0
