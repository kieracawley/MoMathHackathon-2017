/* */ 
'use strict';
var check = require('../check');
var parse = require('../parse');
function parseTaggedListTable(data, start) {
  var p = new parse.Parser(data, start);
  var n = p.parseUShort();
  var list = [];
  for (var i = 0; i < n; i++) {
    list[p.parseTag()] = {offset: p.parseUShort()};
  }
  return list;
}
function parseCoverageTable(data, start) {
  var p = new parse.Parser(data, start);
  var format = p.parseUShort();
  var count = p.parseUShort();
  if (format === 1) {
    return p.parseUShortList(count);
  } else if (format === 2) {
    var coverage = [];
    for (; count--; ) {
      var begin = p.parseUShort();
      var end = p.parseUShort();
      var index = p.parseUShort();
      for (var i = begin; i <= end; i++) {
        coverage[index++] = i;
      }
    }
    return coverage;
  }
}
function parseClassDefTable(data, start) {
  var p = new parse.Parser(data, start);
  var format = p.parseUShort();
  if (format === 1) {
    var startGlyph = p.parseUShort();
    var glyphCount = p.parseUShort();
    var classes = p.parseUShortList(glyphCount);
    return function(glyphID) {
      return classes[glyphID - startGlyph] || 0;
    };
  } else if (format === 2) {
    var rangeCount = p.parseUShort();
    var startGlyphs = [];
    var endGlyphs = [];
    var classValues = [];
    for (var i = 0; i < rangeCount; i++) {
      startGlyphs[i] = p.parseUShort();
      endGlyphs[i] = p.parseUShort();
      classValues[i] = p.parseUShort();
    }
    return function(glyphID) {
      var l = 0;
      var r = startGlyphs.length - 1;
      while (l < r) {
        var c = (l + r + 1) >> 1;
        if (glyphID < startGlyphs[c]) {
          r = c - 1;
        } else {
          l = c;
        }
      }
      if (startGlyphs[l] <= glyphID && glyphID <= endGlyphs[l]) {
        return classValues[l] || 0;
      }
      return 0;
    };
  }
}
function parsePairPosSubTable(data, start) {
  var p = new parse.Parser(data, start);
  var format = p.parseUShort();
  var coverageOffset = p.parseUShort();
  var coverage = parseCoverageTable(data, start + coverageOffset);
  var valueFormat1 = p.parseUShort();
  var valueFormat2 = p.parseUShort();
  var value1;
  var value2;
  if (valueFormat1 !== 4 || valueFormat2 !== 0)
    return;
  var sharedPairSets = {};
  if (format === 1) {
    var pairSetCount = p.parseUShort();
    var pairSet = [];
    var pairSetOffsets = p.parseOffset16List(pairSetCount);
    for (var firstGlyph = 0; firstGlyph < pairSetCount; firstGlyph++) {
      var pairSetOffset = pairSetOffsets[firstGlyph];
      var sharedPairSet = sharedPairSets[pairSetOffset];
      if (!sharedPairSet) {
        sharedPairSet = {};
        p.relativeOffset = pairSetOffset;
        var pairValueCount = p.parseUShort();
        for (; pairValueCount--; ) {
          var secondGlyph = p.parseUShort();
          if (valueFormat1)
            value1 = p.parseShort();
          if (valueFormat2)
            value2 = p.parseShort();
          sharedPairSet[secondGlyph] = value1;
        }
      }
      pairSet[coverage[firstGlyph]] = sharedPairSet;
    }
    return function(leftGlyph, rightGlyph) {
      var pairs = pairSet[leftGlyph];
      if (pairs)
        return pairs[rightGlyph];
    };
  } else if (format === 2) {
    var classDef1Offset = p.parseUShort();
    var classDef2Offset = p.parseUShort();
    var class1Count = p.parseUShort();
    var class2Count = p.parseUShort();
    var getClass1 = parseClassDefTable(data, start + classDef1Offset);
    var getClass2 = parseClassDefTable(data, start + classDef2Offset);
    var kerningMatrix = [];
    for (var i = 0; i < class1Count; i++) {
      var kerningRow = kerningMatrix[i] = [];
      for (var j = 0; j < class2Count; j++) {
        if (valueFormat1)
          value1 = p.parseShort();
        if (valueFormat2)
          value2 = p.parseShort();
        kerningRow[j] = value1;
      }
    }
    var covered = {};
    for (i = 0; i < coverage.length; i++)
      covered[coverage[i]] = 1;
    return function(leftGlyph, rightGlyph) {
      if (!covered[leftGlyph])
        return;
      var class1 = getClass1(leftGlyph);
      var class2 = getClass2(rightGlyph);
      var kerningRow = kerningMatrix[class1];
      if (kerningRow) {
        return kerningRow[class2];
      }
    };
  }
}
function parseLookupTable(data, start) {
  var p = new parse.Parser(data, start);
  var lookupType = p.parseUShort();
  var lookupFlag = p.parseUShort();
  var useMarkFilteringSet = lookupFlag & 0x10;
  var subTableCount = p.parseUShort();
  var subTableOffsets = p.parseOffset16List(subTableCount);
  var table = {
    lookupType: lookupType,
    lookupFlag: lookupFlag,
    markFilteringSet: useMarkFilteringSet ? p.parseUShort() : -1
  };
  if (lookupType === 2) {
    var subtables = [];
    for (var i = 0; i < subTableCount; i++) {
      var pairPosSubTable = parsePairPosSubTable(data, start + subTableOffsets[i]);
      if (pairPosSubTable)
        subtables.push(pairPosSubTable);
    }
    table.getKerningValue = function(leftGlyph, rightGlyph) {
      for (var i = subtables.length; i--; ) {
        var value = subtables[i](leftGlyph, rightGlyph);
        if (value !== undefined)
          return value;
      }
      return 0;
    };
  }
  return table;
}
function parseGposTable(data, start, font) {
  var p = new parse.Parser(data, start);
  var tableVersion = p.parseFixed();
  check.argument(tableVersion === 1, 'Unsupported GPOS table version.');
  parseTaggedListTable(data, start + p.parseUShort());
  parseTaggedListTable(data, start + p.parseUShort());
  var lookupListOffset = p.parseUShort();
  p.relativeOffset = lookupListOffset;
  var lookupCount = p.parseUShort();
  var lookupTableOffsets = p.parseOffset16List(lookupCount);
  var lookupListAbsoluteOffset = start + lookupListOffset;
  for (var i = 0; i < lookupCount; i++) {
    var table = parseLookupTable(data, lookupListAbsoluteOffset + lookupTableOffsets[i]);
    if (table.lookupType === 2 && !font.getGposKerningValue)
      font.getGposKerningValue = table.getKerningValue;
  }
}
exports.parse = parseGposTable;
