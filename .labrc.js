require('dotenv').config();
require('app-module-path').addPath(require('path').join(__dirname, 'src/'));

// default settings for lab test runs.
//
// This is overridden if arguments are passed to lab via the command line.
module.exports = {
  // This version global seems to be introduced by sinon.
  globals: 'version,fetch,Response,Headers,Request,global-symbol-property',
  paths: ['test/internal', 'test/external', 'test/shared'],
  'coverage-exclude': [
    'data',
    'govuk_modules',
    'node_modules',
    'public'
  ]
};
