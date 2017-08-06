/* */ 
'use strict';
var check = require('../check');
var parse = require('../parse');
function parseWindowsKernTable(p) {
  var pairs = {};
  p.skip('uShort');
  var subtableVersion = p.parseUShort();
  check.argument(subtableVersion === 0, 'Unsupported kern sub-table version.');
  p.skip('uShort', 2);
  var nPairs = p.parseUShort();
  p.skip('uShort', 3);
  for (var i = 0; i < nPairs; i += 1) {
    var leftIndex = p.parseUShort();
    var rightIndex = p.parseUShort();
    var value = p.parseShort();
    pairs[leftIndex + ',' + rightIndex] = value;
  }
  return pairs;
}
function parseMacKernTable(p) {
  var pairs = {};
  p.skip('uShort');
  var nTables = p.parseULong();
  if (nTables > 1) {
    console.warn('Only the first kern subtable is supported.');
  }
  p.skip('uLong');
  var coverage = p.parseUShort();
  var subtableVersion = coverage & 0xFF;
  p.skip('uShort');
  if (subtableVersion === 0) {
    var nPairs = p.parseUShort();
    p.skip('uShort', 3);
    for (var i = 0; i < nPairs; i += 1) {
      var leftIndex = p.parseUShort();
      var rightIndex = p.parseUShort();
      var value = p.parseShort();
      pairs[leftIndex + ',' + rightIndex] = value;
    }
  }
  return pairs;
}
function parseKernTable(data, start) {
  var p = new parse.Parser(data, start);
  var tableVersion = p.parseUShort();
  if (tableVersion === 0) {
    return parseWindowsKernTable(p);
  } else if (tableVersion === 1) {
    return parseMacKernTable(p);
  } else {
    throw new Error('Unsupported kern table version (' + tableVersion + ').');
  }
}
exports.parse = parseKernTable;
