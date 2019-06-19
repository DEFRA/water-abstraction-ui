const { APIClient } = require('@envage/hapi-pg-rest-api');

class EntityRolesAPIClient extends APIClient {
  getEntityRoles (entityId) {
    return this.setParams({ entityId }).findAll();
  }
}

module.exports = EntityRolesAPIClient;
