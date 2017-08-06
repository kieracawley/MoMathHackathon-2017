/* */ 
'use strict';
var path = require('./path');
var sfnt = require('./tables/sfnt');
var encoding = require('./encoding');
var glyphset = require('./glyphset');
var Substitution = require('./substitution');
var util = require('./util');
function Font(options) {
  options = options || {};
  if (!options.empty) {
    util.checkArgument(options.familyName, 'When creating a new Font object, familyName is required.');
    util.checkArgument(options.styleName, 'When creating a new Font object, styleName is required.');
    util.checkArgument(options.unitsPerEm, 'When creating a new Font object, unitsPerEm is required.');
    util.checkArgument(options.ascender, 'When creating a new Font object, ascender is required.');
    util.checkArgument(options.descender, 'When creating a new Font object, descender is required.');
    util.checkArgument(options.descender < 0, 'Descender should be negative (e.g. -512).');
    this.names = {
      fontFamily: {en: options.familyName || ' '},
      fontSubfamily: {en: options.styleName || ' '},
      fullName: {en: options.fullName || options.familyName + ' ' + options.styleName},
      postScriptName: {en: options.postScriptName || options.familyName + options.styleName},
      designer: {en: options.designer || ' '},
      designerURL: {en: options.designerURL || ' '},
      manufacturer: {en: options.manufacturer || ' '},
      manufacturerURL: {en: options.manufacturerURL || ' '},
      license: {en: options.license || ' '},
      licenseURL: {en: options.licenseURL || ' '},
      version: {en: options.version || 'Version 0.1'},
      description: {en: options.description || ' '},
      copyright: {en: options.copyright || ' '},
      trademark: {en: options.trademark || ' '}
    };
    this.unitsPerEm = options.unitsPerEm || 1000;
    this.ascender = options.ascender;
    this.descender = options.descender;
    this.createdTimestamp = options.createdTimestamp;
    this.tables = {os2: {
        usWeightClass: options.weightClass || this.usWeightClasses.MEDIUM,
        usWidthClass: options.widthClass || this.usWidthClasses.MEDIUM,
        fsSelection: options.fsSelection || this.fsSelectionValues.REGULAR
      }};
  }
  this.supported = true;
  this.glyphs = new glyphset.GlyphSet(this, options.glyphs || []);
  this.encoding = new encoding.DefaultEncoding(this);
  this.substitution = new Substitution(this);
  this.tables = this.tables || {};
}
Font.prototype.hasChar = function(c) {
  return this.encoding.charToGlyphIndex(c) !== null;
};
Font.prototype.charToGlyphIndex = function(s) {
  return this.encoding.charToGlyphIndex(s);
};
Font.prototype.charToGlyph = function(c) {
  var glyphIndex = this.charToGlyphIndex(c);
  var glyph = this.glyphs.get(glyphIndex);
  if (!glyph) {
    glyph = this.glyphs.get(0);
  }
  return glyph;
};
Font.prototype.stringToGlyphs = function(s, options) {
  options = options || this.defaultRenderOptions;
  var i;
  var indexes = [];
  for (i = 0; i < s.length; i += 1) {
    var c = s[i];
    indexes.push(this.charToGlyphIndex(c));
  }
  var length = indexes.length;
  if (options.features) {
    var script = options.script || this.substitution.getDefaultScriptName();
    var manyToOne = [];
    if (options.features.liga)
      manyToOne = manyToOne.concat(this.substitution.getFeature('liga', script, options.language));
    if (options.features.rlig)
      manyToOne = manyToOne.concat(this.substitution.getFeature('rlig', script, options.language));
    for (i = 0; i < length; i += 1) {
      for (var j = 0; j < manyToOne.length; j++) {
        var ligature = manyToOne[j];
        var components = ligature.sub;
        var compCount = components.length;
        var k = 0;
        while (k < compCount && components[k] === indexes[i + k])
          k++;
        if (k === compCount) {
          indexes.splice(i, compCount, ligature.by);
          length = length - compCount + 1;
        }
      }
    }
  }
  var glyphs = new Array(length);
  var notdef = this.glyphs.get(0);
  for (i = 0; i < length; i += 1) {
    glyphs[i] = this.glyphs.get(indexes[i]) || notdef;
  }
  return glyphs;
};
Font.prototype.nameToGlyphIndex = function(name) {
  return this.glyphNames.nameToGlyphIndex(name);
};
Font.prototype.nameToGlyph = function(name) {
  var glyphIndex = this.nameToGlyphIndex(name);
  var glyph = this.glyphs.get(glyphIndex);
  if (!glyph) {
    glyph = this.glyphs.get(0);
  }
  return glyph;
};
Font.prototype.glyphIndexToName = function(gid) {
  if (!this.glyphNames.glyphIndexToName) {
    return '';
  }
  return this.glyphNames.glyphIndexToName(gid);
};
Font.prototype.getKerningValue = function(leftGlyph, rightGlyph) {
  leftGlyph = leftGlyph.index || leftGlyph;
  rightGlyph = rightGlyph.index || rightGlyph;
  var gposKerning = this.getGposKerningValue;
  return gposKerning ? gposKerning(leftGlyph, rightGlyph) : (this.kerningPairs[leftGlyph + ',' + rightGlyph] || 0);
};
Font.prototype.defaultRenderOptions = {
  kerning: true,
  features: {
    liga: true,
    rlig: true
  }
};
Font.prototype.forEachGlyph = function(text, x, y, fontSize, options, callback) {
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  fontSize = fontSize !== undefined ? fontSize : 72;
  options = options || this.defaultRenderOptions;
  var fontScale = 1 / this.unitsPerEm * fontSize;
  var glyphs = this.stringToGlyphs(text, options);
  for (var i = 0; i < glyphs.length; i += 1) {
    var glyph = glyphs[i];
    callback(glyph, x, y, fontSize, options);
    if (glyph.advanceWidth) {
      x += glyph.advanceWidth * fontScale;
    }
    if (options.kerning && i < glyphs.length - 1) {
      var kerningValue = this.getKerningValue(glyph, glyphs[i + 1]);
      x += kerningValue * fontScale;
    }
    if (options.letterSpacing) {
      x += options.letterSpacing * fontSize;
    } else if (options.tracking) {
      x += (options.tracking / 1000) * fontSize;
    }
  }
};
Font.prototype.getPath = function(text, x, y, fontSize, options) {
  var fullPath = new path.Path();
  this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
    var glyphPath = glyph.getPath(gX, gY, gFontSize);
    fullPath.extend(glyphPath);
  });
  return fullPath;
};
Font.prototype.getPaths = function(text, x, y, fontSize, options) {
  var glyphPaths = [];
  this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
    var glyphPath = glyph.getPath(gX, gY, gFontSize);
    glyphPaths.push(glyphPath);
  });
  return glyphPaths;
};
Font.prototype.draw = function(ctx, text, x, y, fontSize, options) {
  this.getPath(text, x, y, fontSize, options).draw(ctx);
};
Font.prototype.drawPoints = function(ctx, text, x, y, fontSize, options) {
  this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
    glyph.drawPoints(ctx, gX, gY, gFontSize);
  });
};
Font.prototype.drawMetrics = function(ctx, text, x, y, fontSize, options) {
  this.forEachGlyph(text, x, y, fontSize, options, function(glyph, gX, gY, gFontSize) {
    glyph.drawMetrics(ctx, gX, gY, gFontSize);
  });
};
Font.prototype.getEnglishName = function(name) {
  var translations = this.names[name];
  if (translations) {
    return translations.en;
  }
};
Font.prototype.validate = function() {
  var warnings = [];
  var _this = this;
  function assert(predicate, message) {
    if (!predicate) {
      warnings.push(message);
    }
  }
  function assertNamePresent(name) {
    var englishName = _this.getEnglishName(name);
    assert(englishName && englishName.trim().length > 0, 'No English ' + name + ' specified.');
  }
  assertNamePresent('fontFamily');
  assertNamePresent('weightName');
  assertNamePresent('manufacturer');
  assertNamePresent('copyright');
  assertNamePresent('version');
  assert(this.unitsPerEm > 0, 'No unitsPerEm specified.');
};
Font.prototype.toTables = function() {
  return sfnt.fontToTable(this);
};
Font.prototype.toBuffer = function() {
  console.warn('Font.toBuffer is deprecated. Use Font.toArrayBuffer instead.');
  return this.toArrayBuffer();
};
Font.prototype.toArrayBuffer = function() {
  var sfntTable = this.toTables();
  var bytes = sfntTable.encode();
  var buffer = new ArrayBuffer(bytes.length);
  var intArray = new Uint8Array(buffer);
  for (var i = 0; i < bytes.length; i++) {
    intArray[i] = bytes[i];
  }
  return buffer;
};
Font.prototype.download = function(fileName) {
  var familyName = this.getEnglishName('fontFamily');
  var styleName = this.getEnglishName('fontSubfamily');
  fileName = fileName || familyName.replace(/\s/g, '') + '-' + styleName + '.otf';
  var arrayBuffer = this.toArrayBuffer();
  if (util.isBrowser()) {
    window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
    window.requestFileSystem(window.TEMPORARY, arrayBuffer.byteLength, function(fs) {
      fs.root.getFile(fileName, {create: true}, function(fileEntry) {
        fileEntry.createWriter(function(writer) {
          var dataView = new DataView(arrayBuffer);
          var blob = new Blob([dataView], {type: 'font/opentype'});
          writer.write(blob);
          writer.addEventListener('writeend', function() {
            location.href = fileEntry.toURL();
          }, false);
        });
      });
    }, function(err) {
      throw new Error(err.name + ': ' + err.message);
    });
  } else {
    var fs = require('@empty');
    var buffer = util.arrayBufferToNodeBuffer(arrayBuffer);
    fs.writeFileSync(fileName, buffer);
  }
};
Font.prototype.fsSelectionValues = {
  ITALIC: 0x001,
  UNDERSCORE: 0x002,
  NEGATIVE: 0x004,
  OUTLINED: 0x008,
  STRIKEOUT: 0x010,
  BOLD: 0x020,
  REGULAR: 0x040,
  USER_TYPO_METRICS: 0x080,
  WWS: 0x100,
  OBLIQUE: 0x200
};
Font.prototype.usWidthClasses = {
  ULTRA_CONDENSED: 1,
  EXTRA_CONDENSED: 2,
  CONDENSED: 3,
  SEMI_CONDENSED: 4,
  MEDIUM: 5,
  SEMI_EXPANDED: 6,
  EXPANDED: 7,
  EXTRA_EXPANDED: 8,
  ULTRA_EXPANDED: 9
};
Font.prototype.usWeightClasses = {
  THIN: 100,
  EXTRA_LIGHT: 200,
  LIGHT: 300,
  NORMAL: 400,
  MEDIUM: 500,
  SEMI_BOLD: 600,
  BOLD: 700,
  EXTRA_BOLD: 800,
  BLACK: 900
};
exports.Font = Font;
