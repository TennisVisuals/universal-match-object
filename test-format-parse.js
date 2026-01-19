// Test parseFormat for SET1-S:8/TB7
const { parseFormat } = require('./dist/formatConverter.cjs');

const result = parseFormat('SET1-S:8/TB7');
console.log('Parse result:', JSON.stringify(result, null, 2));
