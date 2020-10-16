const ServiceClient = require('../ServiceClient');

class UsersService extends ServiceClient {
  getUserStatus (userId) {
    const url = this.joinUrl('user', userId, 'status');
    return this.serviceRequest.get(url);
  };

  postCreateInternalUser (callingUserId, newUserEmail, permissionsKey) {
    const url = this.joinUrl('user/internal');
    return this.serviceRequest.post(url, { body: {
      callingUserId,
      newUserEmail,
      permissionsKey
    } });
  };

  updateInternalUserPermissions (callingUserId, userId, permissionsKey) {
    const url = this.joinUrl(`user/internal/${userId}`);
    return this.serviceRequest.patch(url, { body: {
      callingUserId,
      permissionsKey
    } });
  };

  disableInternalUser (callingUserId, userId) {
    const url = this.joinUrl(`user/internal/${userId}`);
    return this.serviceRequest.delete(url, { body: {
      callingUserId
    } });
  };

  enableInternalUser (callingUserId, userId) {
    const url = this.joinUrl(`user/internal/${userId}/reinstate`);
    return this.serviceRequest.post(url, { body: { callingUserId } });
  }
}

module.exports = UsersService;
