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
  layout: 'govuk_template',
  context: defaultContext,
  isCached: process.env.NODE_ENV === 'production',
  defaultExtension: 'html'
};
