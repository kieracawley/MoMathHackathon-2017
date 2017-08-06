/* */ 
'use strict';
var check = require('./check');
var LIMIT16 = 32768;
var LIMIT32 = 2147483648;
var decode = {};
var encode = {};
var sizeOf = {};
function constant(v) {
  return function() {
    return v;
  };
}
encode.BYTE = function(v) {
  check.argument(v >= 0 && v <= 255, 'Byte value should be between 0 and 255.');
  return [v];
};
sizeOf.BYTE = constant(1);
encode.CHAR = function(v) {
  return [v.charCodeAt(0)];
};
sizeOf.CHAR = constant(1);
encode.CHARARRAY = function(v) {
  var b = [];
  for (var i = 0; i < v.length; i += 1) {
    b[i] = v.charCodeAt(i);
  }
  return b;
};
sizeOf.CHARARRAY = function(v) {
  return v.length;
};
encode.USHORT = function(v) {
  return [(v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.USHORT = constant(2);
encode.SHORT = function(v) {
  if (v >= LIMIT16) {
    v = -(2 * LIMIT16 - v);
  }
  return [(v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.SHORT = constant(2);
encode.UINT24 = function(v) {
  return [(v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.UINT24 = constant(3);
encode.ULONG = function(v) {
  return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.ULONG = constant(4);
encode.LONG = function(v) {
  if (v >= LIMIT32) {
    v = -(2 * LIMIT32 - v);
  }
  return [(v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.LONG = constant(4);
encode.FIXED = encode.ULONG;
sizeOf.FIXED = sizeOf.ULONG;
encode.FWORD = encode.SHORT;
sizeOf.FWORD = sizeOf.SHORT;
encode.UFWORD = encode.USHORT;
sizeOf.UFWORD = sizeOf.USHORT;
encode.LONGDATETIME = function(v) {
  return [0, 0, 0, 0, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.LONGDATETIME = constant(8);
encode.TAG = function(v) {
  check.argument(v.length === 4, 'Tag should be exactly 4 ASCII characters.');
  return [v.charCodeAt(0), v.charCodeAt(1), v.charCodeAt(2), v.charCodeAt(3)];
};
sizeOf.TAG = constant(4);
encode.Card8 = encode.BYTE;
sizeOf.Card8 = sizeOf.BYTE;
encode.Card16 = encode.USHORT;
sizeOf.Card16 = sizeOf.USHORT;
encode.OffSize = encode.BYTE;
sizeOf.OffSize = sizeOf.BYTE;
encode.SID = encode.USHORT;
sizeOf.SID = sizeOf.USHORT;
encode.NUMBER = function(v) {
  if (v >= -107 && v <= 107) {
    return [v + 139];
  } else if (v >= 108 && v <= 1131) {
    v = v - 108;
    return [(v >> 8) + 247, v & 0xFF];
  } else if (v >= -1131 && v <= -108) {
    v = -v - 108;
    return [(v >> 8) + 251, v & 0xFF];
  } else if (v >= -32768 && v <= 32767) {
    return encode.NUMBER16(v);
  } else {
    return encode.NUMBER32(v);
  }
};
sizeOf.NUMBER = function(v) {
  return encode.NUMBER(v).length;
};
encode.NUMBER16 = function(v) {
  return [28, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.NUMBER16 = constant(3);
encode.NUMBER32 = function(v) {
  return [29, (v >> 24) & 0xFF, (v >> 16) & 0xFF, (v >> 8) & 0xFF, v & 0xFF];
};
sizeOf.NUMBER32 = constant(5);
encode.REAL = function(v) {
  var value = v.toString();
  var m = /\.(\d*?)(?:9{5,20}|0{5,20})\d{0,2}(?:e(.+)|$)/.exec(value);
  if (m) {
    var epsilon = parseFloat('1e' + ((m[2] ? +m[2] : 0) + m[1].length));
    value = (Math.round(v * epsilon) / epsilon).toString();
  }
  var nibbles = '';
  var i;
  var ii;
  for (i = 0, ii = value.length; i < ii; i += 1) {
    var c = value[i];
    if (c === 'e') {
      nibbles += value[++i] === '-' ? 'c' : 'b';
    } else if (c === '.') {
      nibbles += 'a';
    } else if (c === '-') {
      nibbles += 'e';
    } else {
      nibbles += c;
    }
  }
  nibbles += (nibbles.length & 1) ? 'f' : 'ff';
  var out = [30];
  for (i = 0, ii = nibbles.length; i < ii; i += 2) {
    out.push(parseInt(nibbles.substr(i, 2), 16));
  }
  return out;
};
sizeOf.REAL = function(v) {
  return encode.REAL(v).length;
};
encode.NAME = encode.CHARARRAY;
sizeOf.NAME = sizeOf.CHARARRAY;
encode.STRING = encode.CHARARRAY;
sizeOf.STRING = sizeOf.CHARARRAY;
decode.UTF8 = function(data, offset, numBytes) {
  var codePoints = [];
  var numChars = numBytes;
  for (var j = 0; j < numChars; j++, offset += 1) {
    codePoints[j] = data.getUint8(offset);
  }
  return String.fromCharCode.apply(null, codePoints);
};
decode.UTF16 = function(data, offset, numBytes) {
  var codePoints = [];
  var numChars = numBytes / 2;
  for (var j = 0; j < numChars; j++, offset += 2) {
    codePoints[j] = data.getUint16(offset);
  }
  return String.fromCharCode.apply(null, codePoints);
};
encode.UTF16 = function(v) {
  var b = [];
  for (var i = 0; i < v.length; i += 1) {
    var codepoint = v.charCodeAt(i);
    b[b.length] = (codepoint >> 8) & 0xFF;
    b[b.length] = codepoint & 0xFF;
  }
  return b;
};
sizeOf.UTF16 = function(v) {
  return v.length * 2;
};
var eightBitMacEncodings = {
  'x-mac-croatian': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®Š™´¨≠ŽØ∞±≤≥∆µ∂∑∏š∫ªºΩžø' + '¿¡¬√ƒ≈Ć«Č… ÀÃÕŒœĐ—“”‘’÷◊©⁄€‹›Æ»–·‚„‰ÂćÁčÈÍÎÏÌÓÔđÒÚÛÙıˆ˜¯πË˚¸Êæˇ',
  'x-mac-cyrillic': 'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ†°Ґ£§•¶І®©™Ђђ≠Ѓѓ∞±≤≥іµґЈЄєЇїЉљЊњ' + 'јЅ¬√ƒ≈∆«»… ЋћЌќѕ–—“”‘’÷„ЎўЏџ№Ёёяабвгдежзийклмнопрстуфхцчшщъыьэю',
  'x-mac-gaelic': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØḂ±≤≥ḃĊċḊḋḞḟĠġṀæø' + 'ṁṖṗɼƒſṠ«»… ÀÃÕŒœ–—“”‘’ṡẛÿŸṪ€‹›Ŷŷṫ·Ỳỳ⁊ÂÊÁËÈÍÎÏÌÓÔ♣ÒÚÛÙıÝýŴŵẄẅẀẁẂẃ',
  'x-mac-greek': 'Ä¹²É³ÖÜ΅àâä΄¨çéèêë£™îï•½‰ôö¦€ùûü†ΓΔΘΛΞΠß®©ΣΪ§≠°·Α±≤≥¥ΒΕΖΗΙΚΜΦΫΨΩ' + 'άΝ¬ΟΡ≈Τ«»… ΥΧΆΈœ–―“”‘’÷ΉΊΌΎέήίόΏύαβψδεφγηιξκλμνοπώρστθωςχυζϊϋΐΰ\u00AD',
  'x-mac-icelandic': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûüÝ°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€ÐðÞþý·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
  'x-mac-inuit': 'ᐃᐄᐅᐆᐊᐋᐱᐲᐳᐴᐸᐹᑉᑎᑏᑐᑑᑕᑖᑦᑭᑮᑯᑰᑲᑳᒃᒋᒌᒍᒎᒐᒑ°ᒡᒥᒦ•¶ᒧ®©™ᒨᒪᒫᒻᓂᓃᓄᓅᓇᓈᓐᓯᓰᓱᓲᓴᓵᔅᓕᓖᓗ' + 'ᓘᓚᓛᓪᔨᔩᔪᔫᔭ… ᔮᔾᕕᕖᕗ–—“”‘’ᕘᕙᕚᕝᕆᕇᕈᕉᕋᕌᕐᕿᖀᖁᖂᖃᖄᖅᖏᖐᖑᖒᖓᖔᖕᙱᙲᙳᙴᙵᙶᖖᖠᖡᖢᖣᖤᖥᖦᕼŁł',
  'x-mac-ce': 'ÄĀāÉĄÖÜáąČäčĆćéŹźĎíďĒēĖóėôöõúĚěü†°Ę£§•¶ß®©™ę¨≠ģĮįĪ≤≥īĶ∂∑łĻļĽľĹĺŅ' + 'ņŃ¬√ńŇ∆«»… ňŐÕőŌ–—“”‘’÷◊ōŔŕŘ‹›řŖŗŠ‚„šŚśÁŤťÍŽžŪÓÔūŮÚůŰűŲųÝýķŻŁżĢˇ',
  macintosh: 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
  'x-mac-romanian': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ĂȘ∞±≤≥¥µ∂∑∏π∫ªºΩăș' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›Țț‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ',
  'x-mac-turkish': 'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø' + '¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸĞğİıŞş‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙˆ˜¯˘˙˚¸˝˛ˇ'
};
decode.MACSTRING = function(dataView, offset, dataLength, encoding) {
  var table = eightBitMacEncodings[encoding];
  if (table === undefined) {
    return undefined;
  }
  var result = '';
  for (var i = 0; i < dataLength; i++) {
    var c = dataView.getUint8(offset + i);
    if (c <= 0x7F) {
      result += String.fromCharCode(c);
    } else {
      result += table[c & 0x7F];
    }
  }
  return result;
};
var macEncodingTableCache = typeof WeakMap === 'function' && new WeakMap();
var macEncodingCacheKeys;
var getMacEncodingTable = function(encoding) {
  if (!macEncodingCacheKeys) {
    macEncodingCacheKeys = {};
    for (var e in eightBitMacEncodings) {
      macEncodingCacheKeys[e] = new String(e);
    }
  }
  var cacheKey = macEncodingCacheKeys[encoding];
  if (cacheKey === undefined) {
    return undefined;
  }
  if (macEncodingTableCache) {
    var cachedTable = macEncodingTableCache.get(cacheKey);
    if (cachedTable !== undefined) {
      return cachedTable;
    }
  }
  var decodingTable = eightBitMacEncodings[encoding];
  if (decodingTable === undefined) {
    return undefined;
  }
  var encodingTable = {};
  for (var i = 0; i < decodingTable.length; i++) {
    encodingTable[decodingTable.charCodeAt(i)] = i + 0x80;
  }
  if (macEncodingTableCache) {
    macEncodingTableCache.set(cacheKey, encodingTable);
  }
  return encodingTable;
};
encode.MACSTRING = function(str, encoding) {
  var table = getMacEncodingTable(encoding);
  if (table === undefined) {
    return undefined;
  }
  var result = [];
  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);
    if (c >= 0x80) {
      c = table[c];
      if (c === undefined) {
        return undefined;
      }
    }
    result[i] = c;
  }
  return result;
};
sizeOf.MACSTRING = function(str, encoding) {
  var b = encode.MACSTRING(str, encoding);
  if (b !== undefined) {
    return b.length;
  } else {
    return 0;
  }
};
encode.INDEX = function(l) {
  var i;
  var offset = 1;
  var offsets = [offset];
  var data = [];
  for (i = 0; i < l.length; i += 1) {
    var v = encode.OBJECT(l[i]);
    Array.prototype.push.apply(data, v);
    offset += v.length;
    offsets.push(offset);
  }
  if (data.length === 0) {
    return [0, 0];
  }
  var encodedOffsets = [];
  var offSize = (1 + Math.floor(Math.log(offset) / Math.log(2)) / 8) | 0;
  var offsetEncoder = [undefined, encode.BYTE, encode.USHORT, encode.UINT24, encode.ULONG][offSize];
  for (i = 0; i < offsets.length; i += 1) {
    var encodedOffset = offsetEncoder(offsets[i]);
    Array.prototype.push.apply(encodedOffsets, encodedOffset);
  }
  return Array.prototype.concat(encode.Card16(l.length), encode.OffSize(offSize), encodedOffsets, data);
};
sizeOf.INDEX = function(v) {
  return encode.INDEX(v).length;
};
encode.DICT = function(m) {
  var d = [];
  var keys = Object.keys(m);
  var length = keys.length;
  for (var i = 0; i < length; i += 1) {
    var k = parseInt(keys[i], 0);
    var v = m[k];
    d = d.concat(encode.OPERAND(v.value, v.type));
    d = d.concat(encode.OPERATOR(k));
  }
  return d;
};
sizeOf.DICT = function(m) {
  return encode.DICT(m).length;
};
encode.OPERATOR = function(v) {
  if (v < 1200) {
    return [v];
  } else {
    return [12, v - 1200];
  }
};
encode.OPERAND = function(v, type) {
  var d = [];
  if (Array.isArray(type)) {
    for (var i = 0; i < type.length; i += 1) {
      check.argument(v.length === type.length, 'Not enough arguments given for type' + type);
      d = d.concat(encode.OPERAND(v[i], type[i]));
    }
  } else {
    if (type === 'SID') {
      d = d.concat(encode.NUMBER(v));
    } else if (type === 'offset') {
      d = d.concat(encode.NUMBER32(v));
    } else if (type === 'number') {
      d = d.concat(encode.NUMBER(v));
    } else if (type === 'real') {
      d = d.concat(encode.REAL(v));
    } else {
      throw new Error('Unknown operand type ' + type);
    }
  }
  return d;
};
encode.OP = encode.BYTE;
sizeOf.OP = sizeOf.BYTE;
var wmm = typeof WeakMap === 'function' && new WeakMap();
encode.CHARSTRING = function(ops) {
  if (wmm) {
    var cachedValue = wmm.get(ops);
    if (cachedValue !== undefined) {
      return cachedValue;
    }
  }
  var d = [];
  var length = ops.length;
  for (var i = 0; i < length; i += 1) {
    var op = ops[i];
    d = d.concat(encode[op.type](op.value));
  }
  if (wmm) {
    wmm.set(ops, d);
  }
  return d;
};
sizeOf.CHARSTRING = function(ops) {
  return encode.CHARSTRING(ops).length;
};
encode.OBJECT = function(v) {
  var encodingFunction = encode[v.type];
  check.argument(encodingFunction !== undefined, 'No encoding function for type ' + v.type);
  return encodingFunction(v.value);
};
sizeOf.OBJECT = function(v) {
  var sizeOfFunction = sizeOf[v.type];
  check.argument(sizeOfFunction !== undefined, 'No sizeOf function for type ' + v.type);
  return sizeOfFunction(v.value);
};
encode.TABLE = function(table) {
  var d = [];
  var length = table.fields.length;
  var subtables = [];
  var subtableOffsets = [];
  var i;
  for (i = 0; i < length; i += 1) {
    var field = table.fields[i];
    var encodingFunction = encode[field.type];
    check.argument(encodingFunction !== undefined, 'No encoding function for field type ' + field.type + ' (' + field.name + ')');
    var value = table[field.name];
    if (value === undefined) {
      value = field.value;
    }
    var bytes = encodingFunction(value);
    if (field.type === 'TABLE') {
      subtableOffsets.push(d.length);
      d = d.concat([0, 0]);
      subtables.push(bytes);
    } else {
      d = d.concat(bytes);
    }
  }
  for (i = 0; i < subtables.length; i += 1) {
    var o = subtableOffsets[i];
    var offset = d.length;
    check.argument(offset < 65536, 'Table ' + table.tableName + ' too big.');
    d[o] = offset >> 8;
    d[o + 1] = offset & 0xff;
    d = d.concat(subtables[i]);
  }
  return d;
};
sizeOf.TABLE = function(table) {
  var numBytes = 0;
  var length = table.fields.length;
  for (var i = 0; i < length; i += 1) {
    var field = table.fields[i];
    var sizeOfFunction = sizeOf[field.type];
    check.argument(sizeOfFunction !== undefined, 'No sizeOf function for field type ' + field.type + ' (' + field.name + ')');
    var value = table[field.name];
    if (value === undefined) {
      value = field.value;
    }
    numBytes += sizeOfFunction(value);
    if (field.type === 'TABLE') {
      numBytes += 2;
    }
  }
  return numBytes;
};
encode.RECORD = encode.TABLE;
sizeOf.RECORD = sizeOf.TABLE;
encode.LITERAL = function(v) {
  return v;
};
sizeOf.LITERAL = function(v) {
  return v.length;
};
exports.decode = decode;
exports.encode = encode;
exports.sizeOf = sizeOf;
