/* */ 
'use strict';
var parse = require('../parse');
var table = require('../table');
var unicodeRanges = [{
  begin: 0x0000,
  end: 0x007F
}, {
  begin: 0x0080,
  end: 0x00FF
}, {
  begin: 0x0100,
  end: 0x017F
}, {
  begin: 0x0180,
  end: 0x024F
}, {
  begin: 0x0250,
  end: 0x02AF
}, {
  begin: 0x02B0,
  end: 0x02FF
}, {
  begin: 0x0300,
  end: 0x036F
}, {
  begin: 0x0370,
  end: 0x03FF
}, {
  begin: 0x2C80,
  end: 0x2CFF
}, {
  begin: 0x0400,
  end: 0x04FF
}, {
  begin: 0x0530,
  end: 0x058F
}, {
  begin: 0x0590,
  end: 0x05FF
}, {
  begin: 0xA500,
  end: 0xA63F
}, {
  begin: 0x0600,
  end: 0x06FF
}, {
  begin: 0x07C0,
  end: 0x07FF
}, {
  begin: 0x0900,
  end: 0x097F
}, {
  begin: 0x0980,
  end: 0x09FF
}, {
  begin: 0x0A00,
  end: 0x0A7F
}, {
  begin: 0x0A80,
  end: 0x0AFF
}, {
  begin: 0x0B00,
  end: 0x0B7F
}, {
  begin: 0x0B80,
  end: 0x0BFF
}, {
  begin: 0x0C00,
  end: 0x0C7F
}, {
  begin: 0x0C80,
  end: 0x0CFF
}, {
  begin: 0x0D00,
  end: 0x0D7F
}, {
  begin: 0x0E00,
  end: 0x0E7F
}, {
  begin: 0x0E80,
  end: 0x0EFF
}, {
  begin: 0x10A0,
  end: 0x10FF
}, {
  begin: 0x1B00,
  end: 0x1B7F
}, {
  begin: 0x1100,
  end: 0x11FF
}, {
  begin: 0x1E00,
  end: 0x1EFF
}, {
  begin: 0x1F00,
  end: 0x1FFF
}, {
  begin: 0x2000,
  end: 0x206F
}, {
  begin: 0x2070,
  end: 0x209F
}, {
  begin: 0x20A0,
  end: 0x20CF
}, {
  begin: 0x20D0,
  end: 0x20FF
}, {
  begin: 0x2100,
  end: 0x214F
}, {
  begin: 0x2150,
  end: 0x218F
}, {
  begin: 0x2190,
  end: 0x21FF
}, {
  begin: 0x2200,
  end: 0x22FF
}, {
  begin: 0x2300,
  end: 0x23FF
}, {
  begin: 0x2400,
  end: 0x243F
}, {
  begin: 0x2440,
  end: 0x245F
}, {
  begin: 0x2460,
  end: 0x24FF
}, {
  begin: 0x2500,
  end: 0x257F
}, {
  begin: 0x2580,
  end: 0x259F
}, {
  begin: 0x25A0,
  end: 0x25FF
}, {
  begin: 0x2600,
  end: 0x26FF
}, {
  begin: 0x2700,
  end: 0x27BF
}, {
  begin: 0x3000,
  end: 0x303F
}, {
  begin: 0x3040,
  end: 0x309F
}, {
  begin: 0x30A0,
  end: 0x30FF
}, {
  begin: 0x3100,
  end: 0x312F
}, {
  begin: 0x3130,
  end: 0x318F
}, {
  begin: 0xA840,
  end: 0xA87F
}, {
  begin: 0x3200,
  end: 0x32FF
}, {
  begin: 0x3300,
  end: 0x33FF
}, {
  begin: 0xAC00,
  end: 0xD7AF
}, {
  begin: 0xD800,
  end: 0xDFFF
}, {
  begin: 0x10900,
  end: 0x1091F
}, {
  begin: 0x4E00,
  end: 0x9FFF
}, {
  begin: 0xE000,
  end: 0xF8FF
}, {
  begin: 0x31C0,
  end: 0x31EF
}, {
  begin: 0xFB00,
  end: 0xFB4F
}, {
  begin: 0xFB50,
  end: 0xFDFF
}, {
  begin: 0xFE20,
  end: 0xFE2F
}, {
  begin: 0xFE10,
  end: 0xFE1F
}, {
  begin: 0xFE50,
  end: 0xFE6F
}, {
  begin: 0xFE70,
  end: 0xFEFF
}, {
  begin: 0xFF00,
  end: 0xFFEF
}, {
  begin: 0xFFF0,
  end: 0xFFFF
}, {
  begin: 0x0F00,
  end: 0x0FFF
}, {
  begin: 0x0700,
  end: 0x074F
}, {
  begin: 0x0780,
  end: 0x07BF
}, {
  begin: 0x0D80,
  end: 0x0DFF
}, {
  begin: 0x1000,
  end: 0x109F
}, {
  begin: 0x1200,
  end: 0x137F
}, {
  begin: 0x13A0,
  end: 0x13FF
}, {
  begin: 0x1400,
  end: 0x167F
}, {
  begin: 0x1680,
  end: 0x169F
}, {
  begin: 0x16A0,
  end: 0x16FF
}, {
  begin: 0x1780,
  end: 0x17FF
}, {
  begin: 0x1800,
  end: 0x18AF
}, {
  begin: 0x2800,
  end: 0x28FF
}, {
  begin: 0xA000,
  end: 0xA48F
}, {
  begin: 0x1700,
  end: 0x171F
}, {
  begin: 0x10300,
  end: 0x1032F
}, {
  begin: 0x10330,
  end: 0x1034F
}, {
  begin: 0x10400,
  end: 0x1044F
}, {
  begin: 0x1D000,
  end: 0x1D0FF
}, {
  begin: 0x1D400,
  end: 0x1D7FF
}, {
  begin: 0xFF000,
  end: 0xFFFFD
}, {
  begin: 0xFE00,
  end: 0xFE0F
}, {
  begin: 0xE0000,
  end: 0xE007F
}, {
  begin: 0x1900,
  end: 0x194F
}, {
  begin: 0x1950,
  end: 0x197F
}, {
  begin: 0x1980,
  end: 0x19DF
}, {
  begin: 0x1A00,
  end: 0x1A1F
}, {
  begin: 0x2C00,
  end: 0x2C5F
}, {
  begin: 0x2D30,
  end: 0x2D7F
}, {
  begin: 0x4DC0,
  end: 0x4DFF
}, {
  begin: 0xA800,
  end: 0xA82F
}, {
  begin: 0x10000,
  end: 0x1007F
}, {
  begin: 0x10140,
  end: 0x1018F
}, {
  begin: 0x10380,
  end: 0x1039F
}, {
  begin: 0x103A0,
  end: 0x103DF
}, {
  begin: 0x10450,
  end: 0x1047F
}, {
  begin: 0x10480,
  end: 0x104AF
}, {
  begin: 0x10800,
  end: 0x1083F
}, {
  begin: 0x10A00,
  end: 0x10A5F
}, {
  begin: 0x1D300,
  end: 0x1D35F
}, {
  begin: 0x12000,
  end: 0x123FF
}, {
  begin: 0x1D360,
  end: 0x1D37F
}, {
  begin: 0x1B80,
  end: 0x1BBF
}, {
  begin: 0x1C00,
  end: 0x1C4F
}, {
  begin: 0x1C50,
  end: 0x1C7F
}, {
  begin: 0xA880,
  end: 0xA8DF
}, {
  begin: 0xA900,
  end: 0xA92F
}, {
  begin: 0xA930,
  end: 0xA95F
}, {
  begin: 0xAA00,
  end: 0xAA5F
}, {
  begin: 0x10190,
  end: 0x101CF
}, {
  begin: 0x101D0,
  end: 0x101FF
}, {
  begin: 0x102A0,
  end: 0x102DF
}, {
  begin: 0x1F030,
  end: 0x1F09F
}];
function getUnicodeRange(unicode) {
  for (var i = 0; i < unicodeRanges.length; i += 1) {
    var range = unicodeRanges[i];
    if (unicode >= range.begin && unicode < range.end) {
      return i;
    }
  }
  return -1;
}
function parseOS2Table(data, start) {
  var os2 = {};
  var p = new parse.Parser(data, start);
  os2.version = p.parseUShort();
  os2.xAvgCharWidth = p.parseShort();
  os2.usWeightClass = p.parseUShort();
  os2.usWidthClass = p.parseUShort();
  os2.fsType = p.parseUShort();
  os2.ySubscriptXSize = p.parseShort();
  os2.ySubscriptYSize = p.parseShort();
  os2.ySubscriptXOffset = p.parseShort();
  os2.ySubscriptYOffset = p.parseShort();
  os2.ySuperscriptXSize = p.parseShort();
  os2.ySuperscriptYSize = p.parseShort();
  os2.ySuperscriptXOffset = p.parseShort();
  os2.ySuperscriptYOffset = p.parseShort();
  os2.yStrikeoutSize = p.parseShort();
  os2.yStrikeoutPosition = p.parseShort();
  os2.sFamilyClass = p.parseShort();
  os2.panose = [];
  for (var i = 0; i < 10; i++) {
    os2.panose[i] = p.parseByte();
  }
  os2.ulUnicodeRange1 = p.parseULong();
  os2.ulUnicodeRange2 = p.parseULong();
  os2.ulUnicodeRange3 = p.parseULong();
  os2.ulUnicodeRange4 = p.parseULong();
  os2.achVendID = String.fromCharCode(p.parseByte(), p.parseByte(), p.parseByte(), p.parseByte());
  os2.fsSelection = p.parseUShort();
  os2.usFirstCharIndex = p.parseUShort();
  os2.usLastCharIndex = p.parseUShort();
  os2.sTypoAscender = p.parseShort();
  os2.sTypoDescender = p.parseShort();
  os2.sTypoLineGap = p.parseShort();
  os2.usWinAscent = p.parseUShort();
  os2.usWinDescent = p.parseUShort();
  if (os2.version >= 1) {
    os2.ulCodePageRange1 = p.parseULong();
    os2.ulCodePageRange2 = p.parseULong();
  }
  if (os2.version >= 2) {
    os2.sxHeight = p.parseShort();
    os2.sCapHeight = p.parseShort();
    os2.usDefaultChar = p.parseUShort();
    os2.usBreakChar = p.parseUShort();
    os2.usMaxContent = p.parseUShort();
  }
  return os2;
}
function makeOS2Table(options) {
  return new table.Table('OS/2', [{
    name: 'version',
    type: 'USHORT',
    value: 0x0003
  }, {
    name: 'xAvgCharWidth',
    type: 'SHORT',
    value: 0
  }, {
    name: 'usWeightClass',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usWidthClass',
    type: 'USHORT',
    value: 0
  }, {
    name: 'fsType',
    type: 'USHORT',
    value: 0
  }, {
    name: 'ySubscriptXSize',
    type: 'SHORT',
    value: 650
  }, {
    name: 'ySubscriptYSize',
    type: 'SHORT',
    value: 699
  }, {
    name: 'ySubscriptXOffset',
    type: 'SHORT',
    value: 0
  }, {
    name: 'ySubscriptYOffset',
    type: 'SHORT',
    value: 140
  }, {
    name: 'ySuperscriptXSize',
    type: 'SHORT',
    value: 650
  }, {
    name: 'ySuperscriptYSize',
    type: 'SHORT',
    value: 699
  }, {
    name: 'ySuperscriptXOffset',
    type: 'SHORT',
    value: 0
  }, {
    name: 'ySuperscriptYOffset',
    type: 'SHORT',
    value: 479
  }, {
    name: 'yStrikeoutSize',
    type: 'SHORT',
    value: 49
  }, {
    name: 'yStrikeoutPosition',
    type: 'SHORT',
    value: 258
  }, {
    name: 'sFamilyClass',
    type: 'SHORT',
    value: 0
  }, {
    name: 'bFamilyType',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bSerifStyle',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bWeight',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bProportion',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bContrast',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bStrokeVariation',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bArmStyle',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bLetterform',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bMidline',
    type: 'BYTE',
    value: 0
  }, {
    name: 'bXHeight',
    type: 'BYTE',
    value: 0
  }, {
    name: 'ulUnicodeRange1',
    type: 'ULONG',
    value: 0
  }, {
    name: 'ulUnicodeRange2',
    type: 'ULONG',
    value: 0
  }, {
    name: 'ulUnicodeRange3',
    type: 'ULONG',
    value: 0
  }, {
    name: 'ulUnicodeRange4',
    type: 'ULONG',
    value: 0
  }, {
    name: 'achVendID',
    type: 'CHARARRAY',
    value: 'XXXX'
  }, {
    name: 'fsSelection',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usFirstCharIndex',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usLastCharIndex',
    type: 'USHORT',
    value: 0
  }, {
    name: 'sTypoAscender',
    type: 'SHORT',
    value: 0
  }, {
    name: 'sTypoDescender',
    type: 'SHORT',
    value: 0
  }, {
    name: 'sTypoLineGap',
    type: 'SHORT',
    value: 0
  }, {
    name: 'usWinAscent',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usWinDescent',
    type: 'USHORT',
    value: 0
  }, {
    name: 'ulCodePageRange1',
    type: 'ULONG',
    value: 0
  }, {
    name: 'ulCodePageRange2',
    type: 'ULONG',
    value: 0
  }, {
    name: 'sxHeight',
    type: 'SHORT',
    value: 0
  }, {
    name: 'sCapHeight',
    type: 'SHORT',
    value: 0
  }, {
    name: 'usDefaultChar',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usBreakChar',
    type: 'USHORT',
    value: 0
  }, {
    name: 'usMaxContext',
    type: 'USHORT',
    value: 0
  }], options);
}
exports.unicodeRanges = unicodeRanges;
exports.getUnicodeRange = getUnicodeRange;
exports.parse = parseOS2Table;
exports.make = makeOS2Table;
