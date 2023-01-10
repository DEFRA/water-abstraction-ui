const config = require('../../../config')

module.exports = {
  idm: require('./idm')(config),
  crm: require('./crm')(config),
  permits: require('./permits')(config),
  returns: require('./returns')(config),
  system: require('./system')(config),
  water: require('./water')(config)
}
