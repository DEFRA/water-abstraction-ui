const EntitiesAPIClient = require('./EntitiesAPIClient');
const { request } = require('shared/lib/connectors/http');

module.exports = config => ({
  entities: new EntitiesAPIClient(request, {
    endpoint: `${config.services.crm}/entity`,
    headers: {
      Authorization: config.jwt.token
    }
  })
});
