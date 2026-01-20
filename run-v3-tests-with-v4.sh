#!/bin/bash
# Run all v3 tests against v4 adapter

echo "Running full v3 test suite against v4 adapter..."
echo ""

# Create a temporary directory for modified tests
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Copy all non-v4 tests to temp directory
find test -name "*.test.ts" -not -path "*/v4/*" -exec cp --parents {} "$TEMP_DIR" \; 2>/dev/null || \
find test -name "*.test.ts" -not -path "*/v4/*" | while read file; do
  mkdir -p "$TEMP_DIR/$(dirname "$file")"
  cp "$file" "$TEMP_DIR/$file"
done

# Replace import statements to use v4 adapter
find "$TEMP_DIR/test" -name "*.test.ts" -exec sed -i.bak \
  -e "s|from '../../src/matchObject'|from '../../src/v4-umo'|g" \
  -e "s|from '../../src/matchObject\"|from '../../src/v4-umo\"|g" \
  -e "s|import matchObject from '../../src/matchObject'|import matchObject from '../../src/v4-umo'|g" \
  -e "s|import umo from '../../src/matchObject'|import umo from '../../src/v4-umo'|g" \
  {} \; 2>/dev/null || \
find "$TEMP_DIR/test" -name "*.test.ts" | while read file; do
  sed -i '' \
    -e "s|from '../../src/matchObject'|from '../../src/v4-umo'|g" \
    -e "s|from '../../src/matchObject\"|from '../../src/v4-umo\"|g" \
    -e "s|import matchObject from '../../src/matchObject'|import matchObject from '../../src/v4-umo'|g" \
    -e "s|import umo from '../../src/matchObject'|import umo from '../../src/v4-umo'|g" \
    "$file" 2>/dev/null
done

# Run tests from temp directory
pnpm vitest run "$TEMP_DIR/test" --reporter=verbose

# Capture exit code
EXIT_CODE=$?

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "Test run complete. Exit code: $EXIT_CODE"
exit $EXIT_CODE
