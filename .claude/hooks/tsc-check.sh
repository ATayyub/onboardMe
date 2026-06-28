#!/bin/bash
# PostToolUse: runs tsc after any .ts or .tsx file is edited or written.
# Errors are printed so Claude sees them immediately in the tool response.

INPUT=$(cat)
FILE=$(echo "$INPUT" | python3 -c "
import sys, json
d = json.load(sys.stdin)
print(d.get('tool_input', {}).get('file_path', ''))
" 2>/dev/null || echo "")

# Only run for TypeScript files
if [[ "$FILE" != *.ts ]] && [[ "$FILE" != *.tsx ]]; then
    exit 0
fi

echo "[tsc] Checking types after editing $(basename "$FILE")"
TSC_OUT=$(npx tsc --noEmit 2>&1)
TSC_EXIT=$?

if [ $TSC_EXIT -eq 0 ]; then
    echo "[tsc] ✓ No type errors"
else
    echo "[tsc] ✗ Type errors found:"
    echo "$TSC_OUT" | head -40
fi

exit 0
