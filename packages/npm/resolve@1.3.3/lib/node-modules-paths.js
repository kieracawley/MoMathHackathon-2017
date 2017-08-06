/* */ 
(function(process) {
  var path = require('path');
  var parse = path.parse || require('path-parse');
  module.exports = function nodeModulesPaths(start, opts) {
    var modules = opts && opts.moduleDirectory ? [].concat(opts.moduleDirectory) : ['node_modules'];
    ;
    var absoluteStart = path.resolve(start);
    var prefix = '/';
    if (/^([A-Za-z]:)/.test(absoluteStart)) {
      prefix = '';
    } else if (/^\\\\/.test(absoluteStart)) {
      prefix = '\\\\';
    }
    var paths = [absoluteStart];
    var parsed = parse(absoluteStart);
    while (parsed.dir !== paths[paths.length - 1]) {
      paths.push(parsed.dir);
      parsed = parse(parsed.dir);
    }
    var dirs = paths.reduce(function(dirs, aPath) {
      return dirs.concat(modules.map(function(moduleDir) {
        return path.join(prefix, aPath, moduleDir);
      }));
    }, []);
    return opts && opts.paths ? dirs.concat(opts.paths) : dirs;
  };
})(require('process'));
