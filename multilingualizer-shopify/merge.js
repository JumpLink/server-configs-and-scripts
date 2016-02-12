// node merge.js -m locales/de.json -m locales/en.default.json -o merged.json

var argv = require('minimist')(process.argv.slice(2));
var fs = require('fs-extra')


var toMerge = [];
var merged = {};

toMerge.push(
  fs.readJsonSync(argv.m[0], {throws: false})
);

toMerge.push(
  fs.readJsonSync(argv.m[1], {throws: false})
);

for (var page in toMerge[0]) {
  if(!merged[page]) merged[page] = {};
  for (var area in toMerge[0][page]) {
    if(!merged[page][area]) merged[page][area] = {};
    for (var translate in toMerge[0][page][area]) {
      console.log(translate);
      if(page === 'shopify') {
        if(toMerge[1][page] && toMerge[1][page][area] && toMerge[1][page][area][translate]) merged[page][area][translate] = toMerge[0][page][area][translate]+' \/ '+toMerge[1][page][area][translate];
        else merged[page][area][translate] = toMerge[0][page][area][translate];
      } else {
        if(toMerge[1][page] && toMerge[1][page][area] && toMerge[1][page][area][translate]) merged[page][area][translate] = '....'+toMerge[0][page][area][translate]+' ..'+toMerge[1][page][area][translate]+' ....';
        else merged[page][area][translate] = toMerge[0][page][area][translate];
      }
    }
  }
}

console.log(merged);
fs.writeJsonSync(argv.o, merged);
