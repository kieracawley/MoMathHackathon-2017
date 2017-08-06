/* */ 
'use strict';
var check = require('./check');
var encode = require('./types').encode;
var sizeOf = require('./types').sizeOf;
function Table(tableName, fields, options) {
  var i;
  for (i = 0; i < fields.length; i += 1) {
    var field = fields[i];
    this[field.name] = field.value;
  }
  this.tableName = tableName;
  this.fields = fields;
  if (options) {
    var optionKeys = Object.keys(options);
    for (i = 0; i < optionKeys.length; i += 1) {
      var k = optionKeys[i];
      var v = options[k];
      if (this[k] !== undefined) {
        this[k] = v;
      }
    }
  }
}
Table.prototype.encode = function() {
  return encode.TABLE(this);
};
Table.prototype.sizeOf = function() {
  return sizeOf.TABLE(this);
};
function ushortList(itemName, list, count) {
  if (count === undefined) {
    count = list.length;
  }
  var fields = new Array(list.length + 1);
  fields[0] = {
    name: itemName + 'Count',
    type: 'USHORT',
    value: count
  };
  for (var i = 0; i < list.length; i++) {
    fields[i + 1] = {
      name: itemName + i,
      type: 'USHORT',
      value: list[i]
    };
  }
  return fields;
}
function tableList(itemName, records, itemCallback) {
  var count = records.length;
  var fields = new Array(count + 1);
  fields[0] = {
    name: itemName + 'Count',
    type: 'USHORT',
    value: count
  };
  for (var i = 0; i < count; i++) {
    fields[i + 1] = {
      name: itemName + i,
      type: 'TABLE',
      value: itemCallback(records[i], i)
    };
  }
  return fields;
}
function recordList(itemName, records, itemCallback) {
  var count = records.length;
  var fields = [];
  fields[0] = {
    name: itemName + 'Count',
    type: 'USHORT',
    value: count
  };
  for (var i = 0; i < count; i++) {
    fields = fields.concat(itemCallback(records[i], i));
  }
  return fields;
}
function Coverage(coverageTable) {
  if (coverageTable.format === 1) {
    Table.call(this, 'coverageTable', [{
      name: 'coverageFormat',
      type: 'USHORT',
      value: 1
    }].concat(ushortList('glyph', coverageTable.glyphs)));
  } else {
    check.assert(false, 'Can\'t create coverage table format 2 yet.');
  }
}
Coverage.prototype = Object.create(Table.prototype);
Coverage.prototype.constructor = Coverage;
function ScriptList(scriptListTable) {
  Table.call(this, 'scriptListTable', recordList('scriptRecord', scriptListTable, function(scriptRecord, i) {
    var script = scriptRecord.script;
    var defaultLangSys = script.defaultLangSys;
    check.assert(!!defaultLangSys, 'Unable to write GSUB: script ' + scriptRecord.tag + ' has no default language system.');
    return [{
      name: 'scriptTag' + i,
      type: 'TAG',
      value: scriptRecord.tag
    }, {
      name: 'script' + i,
      type: 'TABLE',
      value: new Table('scriptTable', [{
        name: 'defaultLangSys',
        type: 'TABLE',
        value: new Table('defaultLangSys', [{
          name: 'lookupOrder',
          type: 'USHORT',
          value: 0
        }, {
          name: 'reqFeatureIndex',
          type: 'USHORT',
          value: defaultLangSys.reqFeatureIndex
        }].concat(ushortList('featureIndex', defaultLangSys.featureIndexes)))
      }].concat(recordList('langSys', script.langSysRecords, function(langSysRecord, i) {
        var langSys = langSysRecord.langSys;
        return [{
          name: 'langSysTag' + i,
          type: 'TAG',
          value: langSysRecord.tag
        }, {
          name: 'langSys' + i,
          type: 'TABLE',
          value: new Table('langSys', [{
            name: 'lookupOrder',
            type: 'USHORT',
            value: 0
          }, {
            name: 'reqFeatureIndex',
            type: 'USHORT',
            value: langSys.reqFeatureIndex
          }].concat(ushortList('featureIndex', langSys.featureIndexes)))
        }];
      })))
    }];
  }));
}
ScriptList.prototype = Object.create(Table.prototype);
ScriptList.prototype.constructor = ScriptList;
function FeatureList(featureListTable) {
  Table.call(this, 'featureListTable', recordList('featureRecord', featureListTable, function(featureRecord, i) {
    var feature = featureRecord.feature;
    return [{
      name: 'featureTag' + i,
      type: 'TAG',
      value: featureRecord.tag
    }, {
      name: 'feature' + i,
      type: 'TABLE',
      value: new Table('featureTable', [{
        name: 'featureParams',
        type: 'USHORT',
        value: feature.featureParams
      }].concat(ushortList('lookupListIndex', feature.lookupListIndexes)))
    }];
  }));
}
FeatureList.prototype = Object.create(Table.prototype);
FeatureList.prototype.constructor = FeatureList;
function LookupList(lookupListTable, subtableMakers) {
  Table.call(this, 'lookupListTable', tableList('lookup', lookupListTable, function(lookupTable) {
    var subtableCallback = subtableMakers[lookupTable.lookupType];
    check.assert(!!subtableCallback, 'Unable to write GSUB lookup type ' + lookupTable.lookupType + ' tables.');
    return new Table('lookupTable', [{
      name: 'lookupType',
      type: 'USHORT',
      value: lookupTable.lookupType
    }, {
      name: 'lookupFlag',
      type: 'USHORT',
      value: lookupTable.lookupFlag
    }].concat(tableList('subtable', lookupTable.subtables, subtableCallback)));
  }));
}
LookupList.prototype = Object.create(Table.prototype);
LookupList.prototype.constructor = LookupList;
exports.Record = exports.Table = Table;
exports.Coverage = Coverage;
exports.ScriptList = ScriptList;
exports.FeatureList = FeatureList;
exports.LookupList = LookupList;
exports.ushortList = ushortList;
exports.tableList = tableList;
exports.recordList = recordList;
