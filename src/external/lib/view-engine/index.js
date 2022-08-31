const nunjucksEngine = require('./nunjucks')

const config = require('../../config')
const defaultContext = require('shared/view/default-context')

module.exports = {
  engines: {
    njk: nunjucksEngine
  },
  path: './src/external/views',
  context: defaultContext,
  isCached: config.isProduction,
  defaultExtension: 'njk'
}
