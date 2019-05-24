const EntitiesAPIClient = require('./EntitiesAPIClient');
const EntityRolesAPIClient = require('./EntityRolesAPIClient');
const http = require('shared/lib/connectors/http');

module.exports = config => ({
  entities: new EntitiesAPIClient(http.request, {
    endpoint: `${config.services.crm}/entity`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  }),

  entityRoles: new EntityRolesAPIClient(http.request, {
    endpoint: `${config.services.crm}/entity/{entityId}/roles`,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  })
});
