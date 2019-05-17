const handlebarsEngine = require('./handlebars');
const nunjucksEngine = require('./nunjucks');
const defaultContext = require('./default-context');

module.exports = {
  engines: {
    html: handlebarsEngine,
    njk: nunjucksEngine
  },
  path: './src/internal/views',
  layoutPath: './src/internal/views/govuk_template_mustache/layouts',
  partialsPath: './src/internal/views/partials',
  layout: 'govuk_template',
  context: defaultContext,
  isCached: process.env.NODE_ENV === 'production',
  defaultExtension: 'html'
};
