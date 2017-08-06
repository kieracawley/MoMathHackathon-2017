/* */ 
'use strict';
var check = require('./check');
var draw = require('./draw');
var path = require('./path');
function getPathDefinition(glyph, path) {
  var _path = path || {commands: []};
  return {
    configurable: true,
    get: function() {
      if (typeof _path === 'function') {
        _path = _path();
      }
      return _path;
    },
    set: function(p) {
      _path = p;
    }
  };
}
function Glyph(options) {
  this.bindConstructorValues(options);
}
Glyph.prototype.bindConstructorValues = function(options) {
  this.index = options.index || 0;
  this.name = options.name || null;
  this.unicode = options.unicode || undefined;
  this.unicodes = options.unicodes || options.unicode !== undefined ? [options.unicode] : [];
  if (options.xMin) {
    this.xMin = options.xMin;
  }
  if (options.yMin) {
    this.yMin = options.yMin;
  }
  if (options.xMax) {
    this.xMax = options.xMax;
  }
  if (options.yMax) {
    this.yMax = options.yMax;
  }
  if (options.advanceWidth) {
    this.advanceWidth = options.advanceWidth;
  }
  Object.defineProperty(this, 'path', getPathDefinition(this, options.path));
};
Glyph.prototype.addUnicode = function(unicode) {
  if (this.unicodes.length === 0) {
    this.unicode = unicode;
  }
  this.unicodes.push(unicode);
};
Glyph.prototype.getBoundingBox = function() {
  return this.path.getBoundingBox();
};
Glyph.prototype.getPath = function(x, y, fontSize, options) {
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  options = options !== undefined ? options : {
    xScale: 1.0,
    yScale: 1.0
  };
  fontSize = fontSize !== undefined ? fontSize : 72;
  var scale = 1 / this.path.unitsPerEm * fontSize;
  var xScale = options.xScale * scale;
  var yScale = options.yScale * scale;
  var p = new path.Path();
  var commands = this.path.commands;
  for (var i = 0; i < commands.length; i += 1) {
    var cmd = commands[i];
    if (cmd.type === 'M') {
      p.moveTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
    } else if (cmd.type === 'L') {
      p.lineTo(x + (cmd.x * xScale), y + (-cmd.y * yScale));
    } else if (cmd.type === 'Q') {
      p.quadraticCurveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale));
    } else if (cmd.type === 'C') {
      p.curveTo(x + (cmd.x1 * xScale), y + (-cmd.y1 * yScale), x + (cmd.x2 * xScale), y + (-cmd.y2 * yScale), x + (cmd.x * xScale), y + (-cmd.y * yScale));
    } else if (cmd.type === 'Z') {
      p.closePath();
    }
  }
  return p;
};
Glyph.prototype.getContours = function() {
  if (this.points === undefined) {
    return [];
  }
  var contours = [];
  var currentContour = [];
  for (var i = 0; i < this.points.length; i += 1) {
    var pt = this.points[i];
    currentContour.push(pt);
    if (pt.lastPointOfContour) {
      contours.push(currentContour);
      currentContour = [];
    }
  }
  check.argument(currentContour.length === 0, 'There are still points left in the current contour.');
  return contours;
};
Glyph.prototype.getMetrics = function() {
  var commands = this.path.commands;
  var xCoords = [];
  var yCoords = [];
  for (var i = 0; i < commands.length; i += 1) {
    var cmd = commands[i];
    if (cmd.type !== 'Z') {
      xCoords.push(cmd.x);
      yCoords.push(cmd.y);
    }
    if (cmd.type === 'Q' || cmd.type === 'C') {
      xCoords.push(cmd.x1);
      yCoords.push(cmd.y1);
    }
    if (cmd.type === 'C') {
      xCoords.push(cmd.x2);
      yCoords.push(cmd.y2);
    }
  }
  var metrics = {
    xMin: Math.min.apply(null, xCoords),
    yMin: Math.min.apply(null, yCoords),
    xMax: Math.max.apply(null, xCoords),
    yMax: Math.max.apply(null, yCoords),
    leftSideBearing: this.leftSideBearing
  };
  if (!isFinite(metrics.xMin)) {
    metrics.xMin = 0;
  }
  if (!isFinite(metrics.xMax)) {
    metrics.xMax = this.advanceWidth;
  }
  if (!isFinite(metrics.yMin)) {
    metrics.yMin = 0;
  }
  if (!isFinite(metrics.yMax)) {
    metrics.yMax = 0;
  }
  metrics.rightSideBearing = this.advanceWidth - metrics.leftSideBearing - (metrics.xMax - metrics.xMin);
  return metrics;
};
Glyph.prototype.draw = function(ctx, x, y, fontSize, options) {
  this.getPath(x, y, fontSize, options).draw(ctx);
};
Glyph.prototype.drawPoints = function(ctx, x, y, fontSize) {
  function drawCircles(l, x, y, scale) {
    var PI_SQ = Math.PI * 2;
    ctx.beginPath();
    for (var j = 0; j < l.length; j += 1) {
      ctx.moveTo(x + (l[j].x * scale), y + (l[j].y * scale));
      ctx.arc(x + (l[j].x * scale), y + (l[j].y * scale), 2, 0, PI_SQ, false);
    }
    ctx.closePath();
    ctx.fill();
  }
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  fontSize = fontSize !== undefined ? fontSize : 24;
  var scale = 1 / this.path.unitsPerEm * fontSize;
  var blueCircles = [];
  var redCircles = [];
  var path = this.path;
  for (var i = 0; i < path.commands.length; i += 1) {
    var cmd = path.commands[i];
    if (cmd.x !== undefined) {
      blueCircles.push({
        x: cmd.x,
        y: -cmd.y
      });
    }
    if (cmd.x1 !== undefined) {
      redCircles.push({
        x: cmd.x1,
        y: -cmd.y1
      });
    }
    if (cmd.x2 !== undefined) {
      redCircles.push({
        x: cmd.x2,
        y: -cmd.y2
      });
    }
  }
  ctx.fillStyle = 'blue';
  drawCircles(blueCircles, x, y, scale);
  ctx.fillStyle = 'red';
  drawCircles(redCircles, x, y, scale);
};
Glyph.prototype.drawMetrics = function(ctx, x, y, fontSize) {
  var scale;
  x = x !== undefined ? x : 0;
  y = y !== undefined ? y : 0;
  fontSize = fontSize !== undefined ? fontSize : 24;
  scale = 1 / this.path.unitsPerEm * fontSize;
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'black';
  draw.line(ctx, x, -10000, x, 10000);
  draw.line(ctx, -10000, y, 10000, y);
  var xMin = this.xMin || 0;
  var yMin = this.yMin || 0;
  var xMax = this.xMax || 0;
  var yMax = this.yMax || 0;
  var advanceWidth = this.advanceWidth || 0;
  ctx.strokeStyle = 'blue';
  draw.line(ctx, x + (xMin * scale), -10000, x + (xMin * scale), 10000);
  draw.line(ctx, x + (xMax * scale), -10000, x + (xMax * scale), 10000);
  draw.line(ctx, -10000, y + (-yMin * scale), 10000, y + (-yMin * scale));
  draw.line(ctx, -10000, y + (-yMax * scale), 10000, y + (-yMax * scale));
  ctx.strokeStyle = 'green';
  draw.line(ctx, x + (advanceWidth * scale), -10000, x + (advanceWidth * scale), 10000);
};
exports.Glyph = Glyph;