const config = require('../../../config');

module.exports = {
  idm: require('./idm')(config),
  crm: require('./crm')(config),
  water: require('./water')(config)
};
