#!/usr/bin/env python3
"""Convert matchObject.js from IIFE/UMD to ESM"""

with open('src/matchObject.js', 'r') as f:
    lines = f.readlines()

# Remove first line (IIFE start: "!function() {")
lines = lines[1:]

# Remove last 4 lines (IIFE end + UMD exports)
# }();
# empty line
# UMD exports line
# this.umo = umo;
lines = lines[:-4]

# Add ESM exports
esm_exports = """
// ES Module exports
export default umo;

// Named exports for convenience
export const formats = umo.formats;
export const Match = umo.Match;
export const Set = umo.Set;
export const Game = umo.Game;
"""

with open('src/matchObject.esm.js', 'w') as f:
    f.writelines(lines)
    f.write(esm_exports)

print("✅ Created src/matchObject.esm.js")
print(f"   Lines: {len(lines) + esm_exports.count(chr(10))}")
