#!/bin/bash
# Test pbp-validator with v3 and v4 side-by-side
# Usage: ./test-pbp-validator.sh [--index N] [--indices N,M,...] [--limit N]

echo "=== PBP Validator Comparison: v3 vs v4 ==="
echo ""

# Default to testing first 10 matches
LIMIT=10
INDEX=""
INDICES=""

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --limit)
      LIMIT="$2"
      shift 2
      ;;
    --index)
      INDEX="$2"
      shift 2
      ;;
    --indices)
      INDICES="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Build v4 first
echo "Building v4..."
pnpm build 2>&1 | grep -E "(built|error)" || echo "Build complete"
echo ""

# Test with v3
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing with v3 (current production):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cd examples/pbp-validator

if [ -n "$INDEX" ]; then
  echo "Running match index: $INDEX"
  node dist/index.js data/pbp_matches_atp_main_current.csv --index "$INDEX" --debug
elif [ -n "$INDICES" ]; then
  echo "Running match indices: $INDICES"
  node dist/index.js data/pbp_matches_atp_main_current.csv --indices "$INDICES" --debug
else
  echo "Running first $LIMIT matches:"
  node dist/index.js data/pbp_matches_atp_main_current.csv --limit "$LIMIT"
fi

V3_EXIT=$?
cd ../..
echo ""

# Test with v4
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Testing with v4 (new functional implementation):"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -n "$INDEX" ]; then
  echo "Running match index: $INDEX"
  node test-v4-pbp.js --index "$INDEX" --debug
elif [ -n "$INDICES" ]; then
  echo "Running match indices: $INDICES"
  node test-v4-pbp.js --indices "$INDICES" --debug
else
  echo "Running first $LIMIT matches:"
  node test-v4-pbp.js --limit "$LIMIT"
fi

V4_EXIT=$?
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "SUMMARY:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "v3 exit code: $V3_EXIT"
echo "v4 exit code: $V4_EXIT"
echo ""

if [ $V3_EXIT -eq 0 ] && [ $V4_EXIT -ne 0 ]; then
  echo "⚠️  v4 has REGRESSIONS - failures that v3 doesn't have"
  exit 1
elif [ $V3_EXIT -ne 0 ] && [ $V4_EXIT -eq 0 ]; then
  echo "✅ v4 is BETTER - passes where v3 fails"
  exit 0
elif [ $V3_EXIT -eq 0 ] && [ $V4_EXIT -eq 0 ]; then
  echo "✅ BOTH PASS"
  exit 0
else
  echo "⚠️  BOTH FAIL - need comparison"
  exit 1
fi
