'use strict'

require('dotenv').config();
require('app-module-path').addPath(require('path').join(__dirname, 'src/'));

// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  verbose: true,
  coverage: true,
  // Means when we use *.only() in our tests we just get the output for what we've flagged rather than all output but
  // greyed out to show it was skipped
  'silent-skips': true,
  // lcov reporter required for SonarCloud
  reporter: ['console', 'html', 'lcov'],
  output: ['stdout', 'coverage/coverage.html', 'coverage/lcov.info'],
  // Some packages we use expose global variables which cause lab to return a non-zero exit code if we don't ignore
  // them. lab expects the list of globals to ignored to be a single comma-delimited string; for ease of management we
  // define them in an array then join them.
  globals: [
    'Symbol(undici.globalDispatcher.1)'
  ].join(',')
};
