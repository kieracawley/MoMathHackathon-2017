/* */ 
'use strict';
var parse = require('../parse');
var table = require('../table');
function parseMaxpTable(data, start) {
  var maxp = {};
  var p = new parse.Parser(data, start);
  maxp.version = p.parseVersion();
  maxp.numGlyphs = p.parseUShort();
  if (maxp.version === 1.0) {
    maxp.maxPoints = p.parseUShort();
    maxp.maxContours = p.parseUShort();
    maxp.maxCompositePoints = p.parseUShort();
    maxp.maxCompositeContours = p.parseUShort();
    maxp.maxZones = p.parseUShort();
    maxp.maxTwilightPoints = p.parseUShort();
    maxp.maxStorage = p.parseUShort();
    maxp.maxFunctionDefs = p.parseUShort();
    maxp.maxInstructionDefs = p.parseUShort();
    maxp.maxStackElements = p.parseUShort();
    maxp.maxSizeOfInstructions = p.parseUShort();
    maxp.maxComponentElements = p.parseUShort();
    maxp.maxComponentDepth = p.parseUShort();
  }
  return maxp;
}
function makeMaxpTable(numGlyphs) {
  return new table.Table('maxp', [{
    name: 'version',
    type: 'FIXED',
    value: 0x00005000
  }, {
    name: 'numGlyphs',
    type: 'USHORT',
    value: numGlyphs
  }]);
}
exports.parse = parseMaxpTable;
exports.make = makeMaxpTable;
