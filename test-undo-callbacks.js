const matchObjectV3 = require('./dist/matchObject.cjs').default;
const { createV3Adapter } = require('./dist/v4-umo.cjs');

console.log('=== V3 Undo Callback Test ===');
const v3Match = matchObjectV3.Match({ matchUpFormat: 'SET3-S:6/TB7' });
let v3Count = 0;
v3Match.events.undo(() => { v3Count++; console.log('V3 undo callback fired, count:', v3Count); });

v3Match.addPoint({ winner: 0, code: 'S', server: 0 });
v3Match.addPoint({ winner: 1, code: 'R', server: 0 });
console.log('V3: Added 2 points');

v3Match.undo();
console.log('V3 final count:', v3Count, '\n');

console.log('=== V4 Undo Callback Test ===');
const v4Adapter = createV3Adapter();
const v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });
let v4Count = 0;
v4Match.events.undo(() => { v4Count++; console.log('V4 undo callback fired, count:', v4Count); });

v4Match.addPoint({ winner: 0, code: 'S', server: 0 });
v4Match.addPoint({ winner: 1, code: 'R', server: 0 });
console.log('V4: Added 2 points');

v4Match.undo();
console.log('V4 final count:', v4Count);
