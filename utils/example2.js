const path = require('path');

let dir = process.argv[1];
console.log(dir);

console.log(`dirname ${path.parse(dir).dir}`);
console.log(`basename ${path.basename(dir)}`);
console.log(`name ${path.parse(dir).name}`);
console.log(`extension ${path.parse(dir).ext}`);
