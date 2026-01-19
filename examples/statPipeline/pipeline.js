const umo = require("../../v2.x/src/matchObject");
const fs = require("fs");

const match = umo.Match();
const source = JSON.parse(fs.readFileSync("./source.json", "utf8"));
match.addPoints(source.points);
console.log(match.stats.calculated());
