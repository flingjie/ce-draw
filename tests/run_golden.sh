#!/bin/bash
# Golden test runner — renders each input, diffs against expected.
# Usage: bash tests/run_golden.sh

set -euo pipefail
cd "$(dirname "$0")/.."

PASS=0
FAIL=0
TMP=$(mktemp -d)
trap "rm -rf $TMP" EXIT

ROOT="$PWD"

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

# ── JS Tests (Diagram API) ────────────────────────────

for input in tests/input/*.js; do
  name=$(basename "$input" .js)
  expected="tests/expected/${name}.excalidraw"
  actual="$TMP/${name}.excalidraw"

  echo -n "[TEST:js] $name ... "

  node -e "
import('${ROOT}/tests/input/${name}.js').then(mod => {
  const doc = mod.default.toDocument();
  require('fs').writeFileSync('${actual}', JSON.stringify(doc, null, 2));
  process.exit(0);
}).catch(err => { console.error(err.message); process.exit(1); });
" 2>/dev/null

  if [ ! -f "$expected" ]; then
    echo "SKIP (no expected file → generating now)"
    cp "$actual" "$expected"
    echo "DONE"
    ((PASS++))
    continue
  fi

  if diff <(strip "$expected") <(strip "$actual") > /dev/null 2>&1; then
    echo "PASS"
    ((PASS++))
  else
    echo "FAIL"
    ((FAIL++))
    diff <(jq -S . "$expected") <(jq -S . "$actual") | head -30
  fi
done

# ── JSON Tests (renderDiagram) ─────────────────────────

for input in tests/input/*.json; do
  name=$(basename "$input" .json)
  expected="tests/expected/${name}.excalidraw"
  actual="$TMP/${name}.excalidraw"

  echo -n "[TEST:json] $name ... "

  node --input-type=module -e "
import { renderDiagram } from '${ROOT}/dist/index.js';
import { readFileSync, writeFileSync } from 'fs';
const raw = readFileSync('${input}', 'utf-8').trim();
const diagram = JSON.parse(raw);
const doc = renderDiagram(diagram, diagram.theme || 'sketchy');
writeFileSync('${actual}', JSON.stringify(doc, null, 2));
" 2>/dev/null

  if [ ! -f "$expected" ]; then
    echo "SKIP (no expected file → generating now)"
    cp "$actual" "$expected"
    echo "DONE"
    ((PASS++))
    continue
  fi

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
