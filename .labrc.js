require('dotenv').config();
require('app-module-path').addPath(require('path').join(__dirname, 'src/'));

// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  paths: ['test/internal', 'test/external', 'test/shared'],
  'coverage-exclude': [
    'data',
    'govuk_modules',
    'node_modules',
    'public'
  ]
};
