/* */ 
'use strict';
var parse = require('../parse');
var table = require('../table');
function parseHmtxTable(data, start, numMetrics, numGlyphs, glyphs) {
  var advanceWidth;
  var leftSideBearing;
  var p = new parse.Parser(data, start);
  for (var i = 0; i < numGlyphs; i += 1) {
    if (i < numMetrics) {
      advanceWidth = p.parseUShort();
      leftSideBearing = p.parseShort();
    }
    var glyph = glyphs.get(i);
    glyph.advanceWidth = advanceWidth;
    glyph.leftSideBearing = leftSideBearing;
  }
}
function makeHmtxTable(glyphs) {
  var t = new table.Table('hmtx', []);
  for (var i = 0; i < glyphs.length; i += 1) {
    var glyph = glyphs.get(i);
    var advanceWidth = glyph.advanceWidth || 0;
    var leftSideBearing = glyph.leftSideBearing || 0;
    t.fields.push({
      name: 'advanceWidth_' + i,
      type: 'USHORT',
      value: advanceWidth
    });
    t.fields.push({
      name: 'leftSideBearing_' + i,
      type: 'SHORT',
      value: leftSideBearing
    });
  }
  return t;
}
exports.parse = parseHmtxTable;
exports.make = makeHmtxTable;
