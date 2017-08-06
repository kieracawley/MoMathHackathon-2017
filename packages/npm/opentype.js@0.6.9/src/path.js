/* */ 
'use strict';
var bbox = require('./bbox');
function Path() {
  this.commands = [];
  this.fill = 'black';
  this.stroke = null;
  this.strokeWidth = 1;
}
Path.prototype.moveTo = function(x, y) {
  this.commands.push({
    type: 'M',
    x: x,
    y: y
  });
};
Path.prototype.lineTo = function(x, y) {
  this.commands.push({
    type: 'L',
    x: x,
    y: y
  });
};
Path.prototype.curveTo = Path.prototype.bezierCurveTo = function(x1, y1, x2, y2, x, y) {
  this.commands.push({
    type: 'C',
    x1: x1,
    y1: y1,
    x2: x2,
    y2: y2,
    x: x,
    y: y
  });
};
Path.prototype.quadTo = Path.prototype.quadraticCurveTo = function(x1, y1, x, y) {
  this.commands.push({
    type: 'Q',
    x1: x1,
    y1: y1,
    x: x,
    y: y
  });
};
Path.prototype.close = Path.prototype.closePath = function() {
  this.commands.push({type: 'Z'});
};
Path.prototype.extend = function(pathOrCommands) {
  if (pathOrCommands.commands) {
    pathOrCommands = pathOrCommands.commands;
  } else if (pathOrCommands instanceof bbox.BoundingBox) {
    var box = pathOrCommands;
    this.moveTo(box.x1, box.y1);
    this.lineTo(box.x2, box.y1);
    this.lineTo(box.x2, box.y2);
    this.lineTo(box.x1, box.y2);
    this.close();
    return;
  }
  Array.prototype.push.apply(this.commands, pathOrCommands);
};
Path.prototype.getBoundingBox = function() {
  var box = new bbox.BoundingBox();
  var startX = 0;
  var startY = 0;
  var prevX = 0;
  var prevY = 0;
  for (var i = 0; i < this.commands.length; i++) {
    var cmd = this.commands[i];
    switch (cmd.type) {
      case 'M':
        box.addPoint(cmd.x, cmd.y);
        startX = prevX = cmd.x;
        startY = prevY = cmd.y;
        break;
      case 'L':
        box.addPoint(cmd.x, cmd.y);
        prevX = cmd.x;
        prevY = cmd.y;
        break;
      case 'Q':
        box.addQuad(prevX, prevY, cmd.x1, cmd.y1, cmd.x, cmd.y);
        prevX = cmd.x;
        prevY = cmd.y;
        break;
      case 'C':
        box.addBezier(prevX, prevY, cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
        prevX = cmd.x;
        prevY = cmd.y;
        break;
      case 'Z':
        prevX = startX;
        prevY = startY;
        break;
      default:
        throw new Error('Unexpected path commmand ' + cmd.type);
    }
  }
  if (box.isEmpty()) {
    box.addPoint(0, 0);
  }
  return box;
};
Path.prototype.draw = function(ctx) {
  ctx.beginPath();
  for (var i = 0; i < this.commands.length; i += 1) {
    var cmd = this.commands[i];
    if (cmd.type === 'M') {
      ctx.moveTo(cmd.x, cmd.y);
    } else if (cmd.type === 'L') {
      ctx.lineTo(cmd.x, cmd.y);
    } else if (cmd.type === 'C') {
      ctx.bezierCurveTo(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    } else if (cmd.type === 'Q') {
      ctx.quadraticCurveTo(cmd.x1, cmd.y1, cmd.x, cmd.y);
    } else if (cmd.type === 'Z') {
      ctx.closePath();
    }
  }
  if (this.fill) {
    ctx.fillStyle = this.fill;
    ctx.fill();
  }
  if (this.stroke) {
    ctx.strokeStyle = this.stroke;
    ctx.lineWidth = this.strokeWidth;
    ctx.stroke();
  }
};
Path.prototype.toPathData = function(decimalPlaces) {
  decimalPlaces = decimalPlaces !== undefined ? decimalPlaces : 2;
  function floatToString(v) {
    if (Math.round(v) === v) {
      return '' + Math.round(v);
    } else {
      return v.toFixed(decimalPlaces);
    }
  }
  function packValues() {
    var s = '';
    for (var i = 0; i < arguments.length; i += 1) {
      var v = arguments[i];
      if (v >= 0 && i > 0) {
        s += ' ';
      }
      s += floatToString(v);
    }
    return s;
  }
  var d = '';
  for (var i = 0; i < this.commands.length; i += 1) {
    var cmd = this.commands[i];
    if (cmd.type === 'M') {
      d += 'M' + packValues(cmd.x, cmd.y);
    } else if (cmd.type === 'L') {
      d += 'L' + packValues(cmd.x, cmd.y);
    } else if (cmd.type === 'C') {
      d += 'C' + packValues(cmd.x1, cmd.y1, cmd.x2, cmd.y2, cmd.x, cmd.y);
    } else if (cmd.type === 'Q') {
      d += 'Q' + packValues(cmd.x1, cmd.y1, cmd.x, cmd.y);
    } else if (cmd.type === 'Z') {
      d += 'Z';
    }
  }
  return d;
};
Path.prototype.toSVG = function(decimalPlaces) {
  var svg = '<path d="';
  svg += this.toPathData(decimalPlaces);
  svg += '"';
  if (this.fill && this.fill !== 'black') {
    if (this.fill === null) {
      svg += ' fill="none"';
    } else {
      svg += ' fill="' + this.fill + '"';
    }
  }
  if (this.stroke) {
    svg += ' stroke="' + this.stroke + '" stroke-width="' + this.strokeWidth + '"';
  }
  svg += '/>';
  return svg;
};
Path.prototype.toDOMElement = function(decimalPlaces) {
  var temporaryPath = this.toPathData(decimalPlaces);
  var newPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  newPath.setAttribute('d', temporaryPath);
  return newPath;
};
exports.Path = Path;