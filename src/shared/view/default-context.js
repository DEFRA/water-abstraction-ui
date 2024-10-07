const pkg = require('../../../package.json')
const config = require('../../internal/config.js')

module.exports = {
  pageTitle: ' Generic Page',
  htmlLang: 'en',
  cssVersion: pkg.version,
  featureFlags: {
    enableSystemLicenceView: config.featureToggles.enableSystemLicenceView,
    enableMonitoringStationsView: config.featureToggles.enableMonitoringStationsView
  }
}
