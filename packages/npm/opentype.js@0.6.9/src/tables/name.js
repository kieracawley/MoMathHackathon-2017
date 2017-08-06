/* */ 
'use strict';
var types = require('../types');
var decode = types.decode;
var encode = types.encode;
var parse = require('../parse');
var table = require('../table');
var nameTableNames = ['copyright', 'fontFamily', 'fontSubfamily', 'uniqueID', 'fullName', 'version', 'postScriptName', 'trademark', 'manufacturer', 'designer', 'description', 'manufacturerURL', 'designerURL', 'license', 'licenseURL', 'reserved', 'preferredFamily', 'preferredSubfamily', 'compatibleFullName', 'sampleText', 'postScriptFindFontName', 'wwsFamily', 'wwsSubfamily'];
var macLanguages = {
  0: 'en',
  1: 'fr',
  2: 'de',
  3: 'it',
  4: 'nl',
  5: 'sv',
  6: 'es',
  7: 'da',
  8: 'pt',
  9: 'no',
  10: 'he',
  11: 'ja',
  12: 'ar',
  13: 'fi',
  14: 'el',
  15: 'is',
  16: 'mt',
  17: 'tr',
  18: 'hr',
  19: 'zh-Hant',
  20: 'ur',
  21: 'hi',
  22: 'th',
  23: 'ko',
  24: 'lt',
  25: 'pl',
  26: 'hu',
  27: 'es',
  28: 'lv',
  29: 'se',
  30: 'fo',
  31: 'fa',
  32: 'ru',
  33: 'zh',
  34: 'nl-BE',
  35: 'ga',
  36: 'sq',
  37: 'ro',
  38: 'cz',
  39: 'sk',
  40: 'si',
  41: 'yi',
  42: 'sr',
  43: 'mk',
  44: 'bg',
  45: 'uk',
  46: 'be',
  47: 'uz',
  48: 'kk',
  49: 'az-Cyrl',
  50: 'az-Arab',
  51: 'hy',
  52: 'ka',
  53: 'mo',
  54: 'ky',
  55: 'tg',
  56: 'tk',
  57: 'mn-CN',
  58: 'mn',
  59: 'ps',
  60: 'ks',
  61: 'ku',
  62: 'sd',
  63: 'bo',
  64: 'ne',
  65: 'sa',
  66: 'mr',
  67: 'bn',
  68: 'as',
  69: 'gu',
  70: 'pa',
  71: 'or',
  72: 'ml',
  73: 'kn',
  74: 'ta',
  75: 'te',
  76: 'si',
  77: 'my',
  78: 'km',
  79: 'lo',
  80: 'vi',
  81: 'id',
  82: 'tl',
  83: 'ms',
  84: 'ms-Arab',
  85: 'am',
  86: 'ti',
  87: 'om',
  88: 'so',
  89: 'sw',
  90: 'rw',
  91: 'rn',
  92: 'ny',
  93: 'mg',
  94: 'eo',
  128: 'cy',
  129: 'eu',
  130: 'ca',
  131: 'la',
  132: 'qu',
  133: 'gn',
  134: 'ay',
  135: 'tt',
  136: 'ug',
  137: 'dz',
  138: 'jv',
  139: 'su',
  140: 'gl',
  141: 'af',
  142: 'br',
  143: 'iu',
  144: 'gd',
  145: 'gv',
  146: 'ga',
  147: 'to',
  148: 'el-polyton',
  149: 'kl',
  150: 'az',
  151: 'nn'
};
var macLanguageToScript = {
  0: 0,
  1: 0,
  2: 0,
  3: 0,
  4: 0,
  5: 0,
  6: 0,
  7: 0,
  8: 0,
  9: 0,
  10: 5,
  11: 1,
  12: 4,
  13: 0,
  14: 6,
  15: 0,
  16: 0,
  17: 0,
  18: 0,
  19: 2,
  20: 4,
  21: 9,
  22: 21,
  23: 3,
  24: 29,
  25: 29,
  26: 29,
  27: 29,
  28: 29,
  29: 0,
  30: 0,
  31: 4,
  32: 7,
  33: 25,
  34: 0,
  35: 0,
  36: 0,
  37: 0,
  38: 29,
  39: 29,
  40: 0,
  41: 5,
  42: 7,
  43: 7,
  44: 7,
  45: 7,
  46: 7,
  47: 7,
  48: 7,
  49: 7,
  50: 4,
  51: 24,
  52: 23,
  53: 7,
  54: 7,
  55: 7,
  56: 7,
  57: 27,
  58: 7,
  59: 4,
  60: 4,
  61: 4,
  62: 4,
  63: 26,
  64: 9,
  65: 9,
  66: 9,
  67: 13,
  68: 13,
  69: 11,
  70: 10,
  71: 12,
  72: 17,
  73: 16,
  74: 14,
  75: 15,
  76: 18,
  77: 19,
  78: 20,
  79: 22,
  80: 30,
  81: 0,
  82: 0,
  83: 0,
  84: 4,
  85: 28,
  86: 28,
  87: 28,
  88: 0,
  89: 0,
  90: 0,
  91: 0,
  92: 0,
  93: 0,
  94: 0,
  128: 0,
  129: 0,
  130: 0,
  131: 0,
  132: 0,
  133: 0,
  134: 0,
  135: 7,
  136: 4,
  137: 26,
  138: 0,
  139: 0,
  140: 0,
  141: 0,
  142: 0,
  143: 28,
  144: 0,
  145: 0,
  146: 0,
  147: 0,
  148: 6,
  149: 0,
  150: 0,
  151: 0
};
var windowsLanguages = {
  0x0436: 'af',
  0x041C: 'sq',
  0x0484: 'gsw',
  0x045E: 'am',
  0x1401: 'ar-DZ',
  0x3C01: 'ar-BH',
  0x0C01: 'ar',
  0x0801: 'ar-IQ',
  0x2C01: 'ar-JO',
  0x3401: 'ar-KW',
  0x3001: 'ar-LB',
  0x1001: 'ar-LY',
  0x1801: 'ary',
  0x2001: 'ar-OM',
  0x4001: 'ar-QA',
  0x0401: 'ar-SA',
  0x2801: 'ar-SY',
  0x1C01: 'aeb',
  0x3801: 'ar-AE',
  0x2401: 'ar-YE',
  0x042B: 'hy',
  0x044D: 'as',
  0x082C: 'az-Cyrl',
  0x042C: 'az',
  0x046D: 'ba',
  0x042D: 'eu',
  0x0423: 'be',
  0x0845: 'bn',
  0x0445: 'bn-IN',
  0x201A: 'bs-Cyrl',
  0x141A: 'bs',
  0x047E: 'br',
  0x0402: 'bg',
  0x0403: 'ca',
  0x0C04: 'zh-HK',
  0x1404: 'zh-MO',
  0x0804: 'zh',
  0x1004: 'zh-SG',
  0x0404: 'zh-TW',
  0x0483: 'co',
  0x041A: 'hr',
  0x101A: 'hr-BA',
  0x0405: 'cs',
  0x0406: 'da',
  0x048C: 'prs',
  0x0465: 'dv',
  0x0813: 'nl-BE',
  0x0413: 'nl',
  0x0C09: 'en-AU',
  0x2809: 'en-BZ',
  0x1009: 'en-CA',
  0x2409: 'en-029',
  0x4009: 'en-IN',
  0x1809: 'en-IE',
  0x2009: 'en-JM',
  0x4409: 'en-MY',
  0x1409: 'en-NZ',
  0x3409: 'en-PH',
  0x4809: 'en-SG',
  0x1C09: 'en-ZA',
  0x2C09: 'en-TT',
  0x0809: 'en-GB',
  0x0409: 'en',
  0x3009: 'en-ZW',
  0x0425: 'et',
  0x0438: 'fo',
  0x0464: 'fil',
  0x040B: 'fi',
  0x080C: 'fr-BE',
  0x0C0C: 'fr-CA',
  0x040C: 'fr',
  0x140C: 'fr-LU',
  0x180C: 'fr-MC',
  0x100C: 'fr-CH',
  0x0462: 'fy',
  0x0456: 'gl',
  0x0437: 'ka',
  0x0C07: 'de-AT',
  0x0407: 'de',
  0x1407: 'de-LI',
  0x1007: 'de-LU',
  0x0807: 'de-CH',
  0x0408: 'el',
  0x046F: 'kl',
  0x0447: 'gu',
  0x0468: 'ha',
  0x040D: 'he',
  0x0439: 'hi',
  0x040E: 'hu',
  0x040F: 'is',
  0x0470: 'ig',
  0x0421: 'id',
  0x045D: 'iu',
  0x085D: 'iu-Latn',
  0x083C: 'ga',
  0x0434: 'xh',
  0x0435: 'zu',
  0x0410: 'it',
  0x0810: 'it-CH',
  0x0411: 'ja',
  0x044B: 'kn',
  0x043F: 'kk',
  0x0453: 'km',
  0x0486: 'quc',
  0x0487: 'rw',
  0x0441: 'sw',
  0x0457: 'kok',
  0x0412: 'ko',
  0x0440: 'ky',
  0x0454: 'lo',
  0x0426: 'lv',
  0x0427: 'lt',
  0x082E: 'dsb',
  0x046E: 'lb',
  0x042F: 'mk',
  0x083E: 'ms-BN',
  0x043E: 'ms',
  0x044C: 'ml',
  0x043A: 'mt',
  0x0481: 'mi',
  0x047A: 'arn',
  0x044E: 'mr',
  0x047C: 'moh',
  0x0450: 'mn',
  0x0850: 'mn-CN',
  0x0461: 'ne',
  0x0414: 'nb',
  0x0814: 'nn',
  0x0482: 'oc',
  0x0448: 'or',
  0x0463: 'ps',
  0x0415: 'pl',
  0x0416: 'pt',
  0x0816: 'pt-PT',
  0x0446: 'pa',
  0x046B: 'qu-BO',
  0x086B: 'qu-EC',
  0x0C6B: 'qu',
  0x0418: 'ro',
  0x0417: 'rm',
  0x0419: 'ru',
  0x243B: 'smn',
  0x103B: 'smj-NO',
  0x143B: 'smj',
  0x0C3B: 'se-FI',
  0x043B: 'se',
  0x083B: 'se-SE',
  0x203B: 'sms',
  0x183B: 'sma-NO',
  0x1C3B: 'sms',
  0x044F: 'sa',
  0x1C1A: 'sr-Cyrl-BA',
  0x0C1A: 'sr',
  0x181A: 'sr-Latn-BA',
  0x081A: 'sr-Latn',
  0x046C: 'nso',
  0x0432: 'tn',
  0x045B: 'si',
  0x041B: 'sk',
  0x0424: 'sl',
  0x2C0A: 'es-AR',
  0x400A: 'es-BO',
  0x340A: 'es-CL',
  0x240A: 'es-CO',
  0x140A: 'es-CR',
  0x1C0A: 'es-DO',
  0x300A: 'es-EC',
  0x440A: 'es-SV',
  0x100A: 'es-GT',
  0x480A: 'es-HN',
  0x080A: 'es-MX',
  0x4C0A: 'es-NI',
  0x180A: 'es-PA',
  0x3C0A: 'es-PY',
  0x280A: 'es-PE',
  0x500A: 'es-PR',
  0x0C0A: 'es',
  0x040A: 'es',
  0x540A: 'es-US',
  0x380A: 'es-UY',
  0x200A: 'es-VE',
  0x081D: 'sv-FI',
  0x041D: 'sv',
  0x045A: 'syr',
  0x0428: 'tg',
  0x085F: 'tzm',
  0x0449: 'ta',
  0x0444: 'tt',
  0x044A: 'te',
  0x041E: 'th',
  0x0451: 'bo',
  0x041F: 'tr',
  0x0442: 'tk',
  0x0480: 'ug',
  0x0422: 'uk',
  0x042E: 'hsb',
  0x0420: 'ur',
  0x0843: 'uz-Cyrl',
  0x0443: 'uz',
  0x042A: 'vi',
  0x0452: 'cy',
  0x0488: 'wo',
  0x0485: 'sah',
  0x0478: 'ii',
  0x046A: 'yo'
};
function getLanguageCode(platformID, languageID, ltag) {
  switch (platformID) {
    case 0:
      if (languageID === 0xFFFF) {
        return 'und';
      } else if (ltag) {
        return ltag[languageID];
      }
      break;
    case 1:
      return macLanguages[languageID];
    case 3:
      return windowsLanguages[languageID];
  }
  return undefined;
}
var utf16 = 'utf-16';
var macScriptEncodings = {
  0: 'macintosh',
  1: 'x-mac-japanese',
  2: 'x-mac-chinesetrad',
  3: 'x-mac-korean',
  6: 'x-mac-greek',
  7: 'x-mac-cyrillic',
  9: 'x-mac-devanagai',
  10: 'x-mac-gurmukhi',
  11: 'x-mac-gujarati',
  12: 'x-mac-oriya',
  13: 'x-mac-bengali',
  14: 'x-mac-tamil',
  15: 'x-mac-telugu',
  16: 'x-mac-kannada',
  17: 'x-mac-malayalam',
  18: 'x-mac-sinhalese',
  19: 'x-mac-burmese',
  20: 'x-mac-khmer',
  21: 'x-mac-thai',
  22: 'x-mac-lao',
  23: 'x-mac-georgian',
  24: 'x-mac-armenian',
  25: 'x-mac-chinesesimp',
  26: 'x-mac-tibetan',
  27: 'x-mac-mongolian',
  28: 'x-mac-ethiopic',
  29: 'x-mac-ce',
  30: 'x-mac-vietnamese',
  31: 'x-mac-extarabic'
};
var macLanguageEncodings = {
  15: 'x-mac-icelandic',
  17: 'x-mac-turkish',
  18: 'x-mac-croatian',
  24: 'x-mac-ce',
  25: 'x-mac-ce',
  26: 'x-mac-ce',
  27: 'x-mac-ce',
  28: 'x-mac-ce',
  30: 'x-mac-icelandic',
  37: 'x-mac-romanian',
  38: 'x-mac-ce',
  39: 'x-mac-ce',
  40: 'x-mac-ce',
  143: 'x-mac-inuit',
  146: 'x-mac-gaelic'
};
function getEncoding(platformID, encodingID, languageID) {
  switch (platformID) {
    case 0:
      return utf16;
    case 1:
      return macLanguageEncodings[languageID] || macScriptEncodings[encodingID];
    case 3:
      if (encodingID === 1 || encodingID === 10) {
        return utf16;
      }
      break;
  }
  return undefined;
}
function parseNameTable(data, start, ltag) {
  var name = {};
  var p = new parse.Parser(data, start);
  var format = p.parseUShort();
  var count = p.parseUShort();
  var stringOffset = p.offset + p.parseUShort();
  for (var i = 0; i < count; i++) {
    var platformID = p.parseUShort();
    var encodingID = p.parseUShort();
    var languageID = p.parseUShort();
    var nameID = p.parseUShort();
    var property = nameTableNames[nameID] || nameID;
    var byteLength = p.parseUShort();
    var offset = p.parseUShort();
    var language = getLanguageCode(platformID, languageID, ltag);
    var encoding = getEncoding(platformID, encodingID, languageID);
    if (encoding !== undefined && language !== undefined) {
      var text;
      if (encoding === utf16) {
        text = decode.UTF16(data, stringOffset + offset, byteLength);
      } else {
        text = decode.MACSTRING(data, stringOffset + offset, byteLength, encoding);
      }
      if (text) {
        var translations = name[property];
        if (translations === undefined) {
          translations = name[property] = {};
        }
        translations[language] = text;
      }
    }
  }
  var langTagCount = 0;
  if (format === 1) {
    langTagCount = p.parseUShort();
  }
  return name;
}
function reverseDict(dict) {
  var result = {};
  for (var key in dict) {
    result[dict[key]] = parseInt(key);
  }
  return result;
}
function makeNameRecord(platformID, encodingID, languageID, nameID, length, offset) {
  return new table.Record('NameRecord', [{
    name: 'platformID',
    type: 'USHORT',
    value: platformID
  }, {
    name: 'encodingID',
    type: 'USHORT',
    value: encodingID
  }, {
    name: 'languageID',
    type: 'USHORT',
    value: languageID
  }, {
    name: 'nameID',
    type: 'USHORT',
    value: nameID
  }, {
    name: 'length',
    type: 'USHORT',
    value: length
  }, {
    name: 'offset',
    type: 'USHORT',
    value: offset
  }]);
}
function findSubArray(needle, haystack) {
  var needleLength = needle.length;
  var limit = haystack.length - needleLength + 1;
  loop: for (var pos = 0; pos < limit; pos++) {
    for (; pos < limit; pos++) {
      for (var k = 0; k < needleLength; k++) {
        if (haystack[pos + k] !== needle[k]) {
          continue loop;
        }
      }
      return pos;
    }
  }
  return -1;
}
function addStringToPool(s, pool) {
  var offset = findSubArray(s, pool);
  if (offset < 0) {
    offset = pool.length;
    for (var i = 0,
        len = s.length; i < len; ++i) {
      pool.push(s[i]);
    }
  }
  return offset;
}
function makeNameTable(names, ltag) {
  var nameID;
  var nameIDs = [];
  var namesWithNumericKeys = {};
  var nameTableIds = reverseDict(nameTableNames);
  for (var key in names) {
    var id = nameTableIds[key];
    if (id === undefined) {
      id = key;
    }
    nameID = parseInt(id);
    if (isNaN(nameID)) {
      throw new Error('Name table entry "' + key + '" does not exist, see nameTableNames for complete list.');
    }
    namesWithNumericKeys[nameID] = names[key];
    nameIDs.push(nameID);
  }
  var macLanguageIds = reverseDict(macLanguages);
  var windowsLanguageIds = reverseDict(windowsLanguages);
  var nameRecords = [];
  var stringPool = [];
  for (var i = 0; i < nameIDs.length; i++) {
    nameID = nameIDs[i];
    var translations = namesWithNumericKeys[nameID];
    for (var lang in translations) {
      var text = translations[lang];
      var macPlatform = 1;
      var macLanguage = macLanguageIds[lang];
      var macScript = macLanguageToScript[macLanguage];
      var macEncoding = getEncoding(macPlatform, macScript, macLanguage);
      var macName = encode.MACSTRING(text, macEncoding);
      if (macName === undefined) {
        macPlatform = 0;
        macLanguage = ltag.indexOf(lang);
        if (macLanguage < 0) {
          macLanguage = ltag.length;
          ltag.push(lang);
        }
        macScript = 4;
        macName = encode.UTF16(text);
      }
      var macNameOffset = addStringToPool(macName, stringPool);
      nameRecords.push(makeNameRecord(macPlatform, macScript, macLanguage, nameID, macName.length, macNameOffset));
      var winLanguage = windowsLanguageIds[lang];
      if (winLanguage !== undefined) {
        var winName = encode.UTF16(text);
        var winNameOffset = addStringToPool(winName, stringPool);
        nameRecords.push(makeNameRecord(3, 1, winLanguage, nameID, winName.length, winNameOffset));
      }
    }
  }
  nameRecords.sort(function(a, b) {
    return ((a.platformID - b.platformID) || (a.encodingID - b.encodingID) || (a.languageID - b.languageID) || (a.nameID - b.nameID));
  });
  var t = new table.Table('name', [{
    name: 'format',
    type: 'USHORT',
    value: 0
  }, {
    name: 'count',
    type: 'USHORT',
    value: nameRecords.length
  }, {
    name: 'stringOffset',
    type: 'USHORT',
    value: 6 + nameRecords.length * 12
  }]);
  for (var r = 0; r < nameRecords.length; r++) {
    t.fields.push({
      name: 'record_' + r,
      type: 'RECORD',
      value: nameRecords[r]
    });
  }
  t.fields.push({
    name: 'strings',
    type: 'LITERAL',
    value: stringPool
  });
  return t;
}
exports.parse = parseNameTable;
exports.make = makeNameTable;
