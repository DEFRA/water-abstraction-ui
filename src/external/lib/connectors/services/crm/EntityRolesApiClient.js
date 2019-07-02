const SharedEntityRolesApiClient = require('shared/lib/connectors/services/crm/EntityRolesApiClient');
const urlJoin = require('url-join');
const querystring = require('querystring');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const { find } = require('lodash');

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

  /**
   * Gets primary company for current user
   * @TODO assumes on only 1 company per user - may not be the case
   * @param {String} entityId - the individual entity ID
   * @return {Promise} resolves with company entity ID found
   */
  async getPrimaryCompany (entityId) {
    const res = await this.setParams({ entityId }).findMany({
      role: 'primary_user'
    });

    // Find role in list
    const role = find(res.data, (role) => {
      return role.company_entity_id;
    });

    return role ? role.company_entity_id : null;
  }
}

module.exports = EntityRolesApiClient;
