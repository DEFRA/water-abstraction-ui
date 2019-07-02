const ServiceClient = require('../ServiceClient');

class UsersService extends ServiceClient {
  getUserStatus (userId) {
    const url = this.joinUrl('user', userId, 'status');
    return this.serviceRequest.get(url);
  };
}

module.exports = UsersService;
