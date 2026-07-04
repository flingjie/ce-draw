#!/bin/bash
# Golden test runner — renders each input, diffs against expected.
# Usage: bash tests/run_golden.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PASS=0
FAIL=0
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

for input in tests/input/*.mmd; do
  name=$(basename "$input" .mmd)
  expected="tests/expected/${name}.excalidraw"
  actual="$TMP/${name}.excalidraw"

  echo -n "[TEST] $name ... "

  node --input-type=module -e "
import { mermaidToExcalidraw } from './dist/index.js';
import { readFileSync, writeFileSync } from 'fs';
const m = readFileSync('$input', 'utf-8').trim();
const doc = await mermaidToExcalidraw(m, 'sketchy');
writeFileSync('$actual', JSON.stringify(doc, null, 2));
" 2>/dev/null

  if [ ! -f "$expected" ]; then
    echo "SKIP (no expected file)"
    continue
  fi

   # Strip unpredictable fields (UUIDs, seeds) before comparing
   strip() {
     jq -S '
       walk(
         if type == "object" then
           del(.id, .seed, .versionNonce, .containerId) 
         else . end
       )
     ' "$1" 2>/dev/null
   }
   if diff <(strip "$expected") <(strip "$actual") > /dev/null 2>&1; then
    echo "PASS"
    ((PASS++))
  else
    echo "FAIL"
    ((FAIL++))
    diff <(jq -S . "$expected") <(jq -S . "$actual") | head -30
  fi
done

echo ""
echo "Results: $PASS passed, $FAIL failed"
[ "$FAIL" -eq 0 ] || exit 1
