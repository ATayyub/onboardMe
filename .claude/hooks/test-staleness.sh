#!/bin/bash
# PostToolUse: warns when test results are stale after a source file is edited.
# Fires after Edit/Write on any .ts/.tsx file that is NOT a test file.

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Only run for TypeScript source files
if [[ "$FILE" != *.ts ]] && [[ "$FILE" != *.tsx ]]; then
  exit 0
fi

# Skip test files themselves
if [[ "$FILE" == *.spec.* ]] || [[ "$FILE" == *.test.* ]] || [[ "$FILE" == */tests/* ]]; then
  exit 0
fi

# Skip config and hook files
if [[ "$FILE" == *sentry* ]] || [[ "$FILE" == *instrumentation* ]] || [[ "$FILE" == *next.config* ]]; then
  exit 0
fi

RESULTS_FILE="test-results/.last-run.json"

if [ ! -f "$RESULTS_FILE" ]; then
  echo "[tests] No test results on record. Run: npm test"
  exit 0
fi

# Get file age in seconds (macOS + Linux compatible)
RESULTS_MOD=$(stat -f %m "$RESULTS_FILE" 2>/dev/null || stat -c %Y "$RESULTS_FILE" 2>/dev/null || echo 0)
NOW=$(date +%s)
AGE=$(( NOW - RESULTS_MOD ))

if [ "$AGE" -gt 3600 ]; then
  AGE_H=$(( AGE / 3600 ))
  STATUS=$(python3 -c "import json; d=json.load(open('$RESULTS_FILE')); print(d.get('status','unknown'))" 2>/dev/null || echo "unknown")
  echo "[tests] Results are ${AGE_H}h old (status: $STATUS). Consider running: npm test"
fi

exit 0
