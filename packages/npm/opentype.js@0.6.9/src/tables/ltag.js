/* */ 
'use strict';
var check = require('../check');
var parse = require('../parse');
var table = require('../table');
function makeLtagTable(tags) {
  var result = new table.Table('ltag', [{
    name: 'version',
    type: 'ULONG',
    value: 1
  }, {
    name: 'flags',
    type: 'ULONG',
    value: 0
  }, {
    name: 'numTags',
    type: 'ULONG',
    value: tags.length
  }]);
  var stringPool = '';
  var stringPoolOffset = 12 + tags.length * 4;
  for (var i = 0; i < tags.length; ++i) {
    var pos = stringPool.indexOf(tags[i]);
    if (pos < 0) {
      pos = stringPool.length;
      stringPool += tags[i];
    }
    result.fields.push({
      name: 'offset ' + i,
      type: 'USHORT',
      value: stringPoolOffset + pos
    });
    result.fields.push({
      name: 'length ' + i,
      type: 'USHORT',
      value: tags[i].length
    });
  }
  result.fields.push({
    name: 'stringPool',
    type: 'CHARARRAY',
    value: stringPool
  });
  return result;
}
function parseLtagTable(data, start) {
  var p = new parse.Parser(data, start);
  var tableVersion = p.parseULong();
  check.argument(tableVersion === 1, 'Unsupported ltag table version.');
  p.skip('uLong', 1);
  var numTags = p.parseULong();
  var tags = [];
  for (var i = 0; i < numTags; i++) {
    var tag = '';
    var offset = start + p.parseUShort();
    var length = p.parseUShort();
    for (var j = offset; j < offset + length; ++j) {
      tag += String.fromCharCode(data.getInt8(j));
    }
    tags.push(tag);
  }
  return tags;
}
exports.make = makeLtagTable;
exports.parse = parseLtagTable;
