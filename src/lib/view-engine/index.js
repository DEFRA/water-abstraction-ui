const path = require('path');
const handlebarsEngine = require('./handlebars.js');
const nunjucksEngine = require('./nunjucks.js');
const defaultContext = require('./default-context.js');

module.exports = {
  engines: {
    html: handlebarsEngine,
    njk: nunjucksEngine
  },

  path: './src/views',
  layoutPath: './src/views/govuk_template_mustache/layouts',
  partialsPath: './src/views/partials',

  // relativeTo: __dirname,
  // path: path.join(__dirname, ''),
  // layoutPath: path.join(__dirname, 'govuk_template_mustache/layouts'),
  layout: 'govuk_template',
  // partialsPath: path.join(__dirname, 'partials/'),
  context: defaultContext,
  isCached: process.env.NODE_ENV === 'production',
  defaultExtension: 'html'
};
