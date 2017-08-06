/* */ 
'use strict';
var encoding = require('../encoding');
var parse = require('../parse');
var table = require('../table');
function parsePostTable(data, start) {
  var post = {};
  var p = new parse.Parser(data, start);
  var i;
  post.version = p.parseVersion();
  post.italicAngle = p.parseFixed();
  post.underlinePosition = p.parseShort();
  post.underlineThickness = p.parseShort();
  post.isFixedPitch = p.parseULong();
  post.minMemType42 = p.parseULong();
  post.maxMemType42 = p.parseULong();
  post.minMemType1 = p.parseULong();
  post.maxMemType1 = p.parseULong();
  switch (post.version) {
    case 1:
      post.names = encoding.standardNames.slice();
      break;
    case 2:
      post.numberOfGlyphs = p.parseUShort();
      post.glyphNameIndex = new Array(post.numberOfGlyphs);
      for (i = 0; i < post.numberOfGlyphs; i++) {
        post.glyphNameIndex[i] = p.parseUShort();
      }
      post.names = [];
      for (i = 0; i < post.numberOfGlyphs; i++) {
        if (post.glyphNameIndex[i] >= encoding.standardNames.length) {
          var nameLength = p.parseChar();
          post.names.push(p.parseString(nameLength));
        }
      }
      break;
    case 2.5:
      post.numberOfGlyphs = p.parseUShort();
      post.offset = new Array(post.numberOfGlyphs);
      for (i = 0; i < post.numberOfGlyphs; i++) {
        post.offset[i] = p.parseChar();
      }
      break;
  }
  return post;
}
function makePostTable() {
  return new table.Table('post', [{
    name: 'version',
    type: 'FIXED',
    value: 0x00030000
  }, {
    name: 'italicAngle',
    type: 'FIXED',
    value: 0
  }, {
    name: 'underlinePosition',
    type: 'FWORD',
    value: 0
  }, {
    name: 'underlineThickness',
    type: 'FWORD',
    value: 0
  }, {
    name: 'isFixedPitch',
    type: 'ULONG',
    value: 0
  }, {
    name: 'minMemType42',
    type: 'ULONG',
    value: 0
  }, {
    name: 'maxMemType42',
    type: 'ULONG',
    value: 0
  }, {
    name: 'minMemType1',
    type: 'ULONG',
    value: 0
  }, {
    name: 'maxMemType1',
    type: 'ULONG',
    value: 0
  }]);
}
exports.parse = parsePostTable;
exports.make = makePostTable;
