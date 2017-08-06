/* */ 
'use strict';
var check = require('../check');
var parse = require('../parse');
var table = require('../table');
function addName(name, names) {
  var nameString = JSON.stringify(name);
  var nameID = 256;
  for (var nameKey in names) {
    var n = parseInt(nameKey);
    if (!n || n < 256) {
      continue;
    }
    if (JSON.stringify(names[nameKey]) === nameString) {
      return n;
    }
    if (nameID <= n) {
      nameID = n + 1;
    }
  }
  names[nameID] = name;
  return nameID;
}
function makeFvarAxis(n, axis, names) {
  var nameID = addName(axis.name, names);
  return [{
    name: 'tag_' + n,
    type: 'TAG',
    value: axis.tag
  }, {
    name: 'minValue_' + n,
    type: 'FIXED',
    value: axis.minValue << 16
  }, {
    name: 'defaultValue_' + n,
    type: 'FIXED',
    value: axis.defaultValue << 16
  }, {
    name: 'maxValue_' + n,
    type: 'FIXED',
    value: axis.maxValue << 16
  }, {
    name: 'flags_' + n,
    type: 'USHORT',
    value: 0
  }, {
    name: 'nameID_' + n,
    type: 'USHORT',
    value: nameID
  }];
}
function parseFvarAxis(data, start, names) {
  var axis = {};
  var p = new parse.Parser(data, start);
  axis.tag = p.parseTag();
  axis.minValue = p.parseFixed();
  axis.defaultValue = p.parseFixed();
  axis.maxValue = p.parseFixed();
  p.skip('uShort', 1);
  axis.name = names[p.parseUShort()] || {};
  return axis;
}
function makeFvarInstance(n, inst, axes, names) {
  var nameID = addName(inst.name, names);
  var fields = [{
    name: 'nameID_' + n,
    type: 'USHORT',
    value: nameID
  }, {
    name: 'flags_' + n,
    type: 'USHORT',
    value: 0
  }];
  for (var i = 0; i < axes.length; ++i) {
    var axisTag = axes[i].tag;
    fields.push({
      name: 'axis_' + n + ' ' + axisTag,
      type: 'FIXED',
      value: inst.coordinates[axisTag] << 16
    });
  }
  return fields;
}
function parseFvarInstance(data, start, axes, names) {
  var inst = {};
  var p = new parse.Parser(data, start);
  inst.name = names[p.parseUShort()] || {};
  p.skip('uShort', 1);
  inst.coordinates = {};
  for (var i = 0; i < axes.length; ++i) {
    inst.coordinates[axes[i].tag] = p.parseFixed();
  }
  return inst;
}
function makeFvarTable(fvar, names) {
  var result = new table.Table('fvar', [{
    name: 'version',
    type: 'ULONG',
    value: 0x10000
  }, {
    name: 'offsetToData',
    type: 'USHORT',
    value: 0
  }, {
    name: 'countSizePairs',
    type: 'USHORT',
    value: 2
  }, {
    name: 'axisCount',
    type: 'USHORT',
    value: fvar.axes.length
  }, {
    name: 'axisSize',
    type: 'USHORT',
    value: 20
  }, {
    name: 'instanceCount',
    type: 'USHORT',
    value: fvar.instances.length
  }, {
    name: 'instanceSize',
    type: 'USHORT',
    value: 4 + fvar.axes.length * 4
  }]);
  result.offsetToData = result.sizeOf();
  for (var i = 0; i < fvar.axes.length; i++) {
    result.fields = result.fields.concat(makeFvarAxis(i, fvar.axes[i], names));
  }
  for (var j = 0; j < fvar.instances.length; j++) {
    result.fields = result.fields.concat(makeFvarInstance(j, fvar.instances[j], fvar.axes, names));
  }
  return result;
}
function parseFvarTable(data, start, names) {
  var p = new parse.Parser(data, start);
  var tableVersion = p.parseULong();
  check.argument(tableVersion === 0x00010000, 'Unsupported fvar table version.');
  var offsetToData = p.parseOffset16();
  p.skip('uShort', 1);
  var axisCount = p.parseUShort();
  var axisSize = p.parseUShort();
  var instanceCount = p.parseUShort();
  var instanceSize = p.parseUShort();
  var axes = [];
  for (var i = 0; i < axisCount; i++) {
    axes.push(parseFvarAxis(data, start + offsetToData + i * axisSize, names));
  }
  var instances = [];
  var instanceStart = start + offsetToData + axisCount * axisSize;
  for (var j = 0; j < instanceCount; j++) {
    instances.push(parseFvarInstance(data, instanceStart + j * instanceSize, axes, names));
  }
  return {
    axes: axes,
    instances: instances
  };
}
exports.make = makeFvarTable;
exports.parse = parseFvarTable;