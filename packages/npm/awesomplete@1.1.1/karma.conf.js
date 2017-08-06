/* */ 
(function(process) {
  module.exports = function(config) {
    config.set({
      basePath: '',
      frameworks: ['jasmine', 'jasmine-def', 'fixture'],
      files: ['awesomplete.js', 'test/specHelper.js', {
        pattern: 'test/fixtures/**/*.html',
        watched: true,
        included: true,
        served: true
      }, 'test/**/*Spec.js'],
      exclude: ['**/*.swp'],
      preprocessors: {
        'awesomplete.js': ['coverage'],
        '**/*.html': ['html2js']
      },
      reporters: ['dots', 'coverage'],
      coverageReporter: {
        type: 'lcov',
        subdir: '.'
      },
      port: 9876,
      colors: true,
      logLevel: config.LOG_INFO,
      autoWatch: true,
      browsers: process.env.TRAVIS ? ['ChromeTravisCI'] : ['Chrome'],
      customLaunchers: {ChromeTravisCI: {
          base: 'Chrome',
          flags: ['--no-sandbox']
        }},
      singleRun: false
    });
  };
})(require('process'));
