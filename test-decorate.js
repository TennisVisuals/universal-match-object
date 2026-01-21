const v4Module = require('./dist/v4/index.cjs');
const createV3Adapter = v4Module.createV3Adapter;

const v4Adapter = createV3Adapter();
const v4Match = v4Adapter.Match({ matchUpFormat: 'SET3-S:6/TB7' });

v4Match.addPoint({ winner: 1, result: 'Winner', code: 'R', server: 0 });

const lastPoint = v4Match.history.lastPoint();
console.log('Last point before decoration:', JSON.stringify(lastPoint, null, 2));

v4Match.decoratePoint(lastPoint, { hand: 'Forehand', stroke: 'Volley' });

console.log('\nLast point after decoration:', JSON.stringify(lastPoint, null, 2));

const points = v4Match.history.points();
console.log('\nFirst point from history.points():', JSON.stringify(points[0], null, 2));
