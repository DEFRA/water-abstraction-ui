const BaseUsersAPIClient = require('shared/lib/connectors/services/idm/UsersAPIClient');

class UsersAPIClient extends BaseUsersAPIClient {
  updateExternalId (user, externalId) {
    if (user.external_id) {
      return;
    }
    return this.updateOne(user.user_id, { external_id: externalId });
  };
}

module.exports = UsersAPIClient;
