const nunjucksEngine = require('./nunjucks')
const defaultContext = require('shared/view/default-context')

module.exports = {
  engines: {
    njk: nunjucksEngine
  },
  path: './src/internal/views',
  context: defaultContext,
  isCached: process.env.NODE_ENV === 'production',
  defaultExtension: 'njk'
}
