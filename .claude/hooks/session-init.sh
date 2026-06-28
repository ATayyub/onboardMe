#!/bin/bash
# Session context summary — run at the start of a session to self-orient.
# Reads session-log.md and reports: current phase, last completed item, next pending item.

LOG="session-log.md"

if [ ! -f "$LOG" ]; then
  echo "[session-init] session-log.md not found — run from the project root."
  exit 0
fi

echo ""
echo "════════════════════════════════════════"
echo "  OnboardMe — Session Context"
echo "════════════════════════════════════════"

# Find the last completed phase (last line containing [x])
LAST_COMPLETED=$(grep -n '\- \[x\]' "$LOG" | tail -1)
if [ -n "$LAST_COMPLETED" ]; then
  echo "  Last completed: $(echo "$LAST_COMPLETED" | sed 's/.*\- \[x\] //')"
fi

# Find the first unchecked item (first line containing [ ])
NEXT_PENDING=$(grep -n '\- \[ \]' "$LOG" | head -1)
if [ -n "$NEXT_PENDING" ]; then
  echo "  Next pending:   $(echo "$NEXT_PENDING" | sed 's/.*\- \[ \] //')"
else
  echo "  Next pending:   (none — all items checked)"
fi

# Current phase heading (last Phase heading before a pending item)
CURRENT_PHASE=$(grep -n '### Phase' "$LOG" | tail -1 | sed 's/.*### //')
if [ -n "$CURRENT_PHASE" ]; then
  echo "  Current phase:  $CURRENT_PHASE"
fi

# Open blockers
OPEN_BLOCKERS=$(grep -c '| [0-9]' "$LOG" 2>/dev/null || echo 0)
echo "  Blockers in log: $OPEN_BLOCKERS row(s) — check session-log.md Blockers table"

# Last test run status
RESULTS="test-results/.last-run.json"
if [ -f "$RESULTS" ]; then
  STATUS=$(python3 -c "import json; d=json.load(open('$RESULTS')); print(d.get('status','unknown'))" 2>/dev/null || echo "unreadable")
  RESULTS_AGE=$(( $(date +%s) - $(stat -f %m "$RESULTS" 2>/dev/null || stat -c %Y "$RESULTS" 2>/dev/null || echo 0) ))
  RESULTS_AGE_H=$(( RESULTS_AGE / 3600 ))
  echo "  Last E2E run:   $STATUS (${RESULTS_AGE_H}h ago)"
else
  echo "  Last E2E run:   no results file found — run: npm test"
fi

echo "════════════════════════════════════════"
echo ""
echo "Suggested actions:"
echo "  • Read memory/project.md for scope"
echo "  • Read memory/feedback.md before writing code"
echo "  • Read decision.md for architectural non-negotiables"
echo ""
