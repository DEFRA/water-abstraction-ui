const SharedEntityRolesApiClient = require('shared/lib/connectors/services/crm/EntityRolesApiClient');
const urlJoin = require('url-join');
const querystring = require('querystring');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

class EntityRolesApiClient extends SharedEntityRolesApiClient {
  getEditableRoles (entityId, sort = 'entity_nm', direction = 1) {
    const params = querystring.stringify({
      sort,
      direction
    });
    const uri = urlJoin(this.config.serviceUrl, 'entity', entityId, `colleagues?${params}`);
    return serviceRequest.get(uri);
  };

  deleteColleagueRole (entityId, entityRoleId) {
    const uri = urlJoin(this.config.serviceUrl, 'entity', entityId, '/colleagues/', entityRoleId);
    return serviceRequest.delete(uri);
  };

  addColleagueRole (entityId, colleagueEntityID, role = 'user') {
    const uri = urlJoin(this.config.serviceUrl, 'entity', entityId, 'colleagues');
    return serviceRequest.post(uri, {
      body: { colleagueEntityID, role }
    });
  };
}

module.exports = EntityRolesApiClient;
