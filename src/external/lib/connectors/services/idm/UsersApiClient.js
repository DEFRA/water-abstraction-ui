const SharedUsersApiClient = require('shared/lib/connectors/services/idm/UsersApiClient');
const uuid = require('uuid/v4');

class UsersApiClient extends SharedUsersApiClient {
  /**
   * Create user account in registration process
   * No password is supplied so a random GUID is used as a
   * temporary password, and the user is flagged for password reset
   * @param {String} application - the application this user will use
   * @param {String} emailAddress - the user email address
   * @return {Promise} - resolves if user account created
   */
  createUserWithoutPassword (application, emailAddress) {
    return this.create({
      user_name: emailAddress.toLowerCase(),
      password: uuid(),
      reset_guid: uuid(),
      user_data: {},
      reset_required: 1,
      application,
      role: {
        scopes: ['external']
      }
    });
  }
}

module.exports = UsersApiClient;
