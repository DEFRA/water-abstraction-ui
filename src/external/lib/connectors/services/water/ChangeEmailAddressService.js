const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ChangeEmailAddressService extends ServiceClient {
  /**
   * The first step in the email address change process - the user
   * verifies their password and a verification ID is used for subsequent
   * requests
   *
   * @param  {Number} userId   - IDM user ID
   * @param  {String} email - the desired email address for this user
   * @return {Promise}
   */
  postGenerateSecurityCode (userId, email) {
    const url = this.joinUrl(`user/${userId}/change-email-address`);
    const options = {
      body: { email }
    };
    return this.serviceRequest.post(url, options);
  }

  /**
   * The second step in the email address change process - the user
   * verifies their password and a verification ID is used for subsequent
   * requests
   *
   * @param  {Number} userId   - IDM user ID
   * @param  {String} securityCode
   * @return {Promise}
   */
  postSecurityCode (userId, securityCode) {
    const url = this.joinUrl(`user/${userId}/change-email-address/code`);
    const options = {
      body: { securityCode }
    };
    return this.serviceRequest.post(url, options);
  }

  /**
   * Gets status of verification
   * @type {[type]}
   */
  getStatus (userId) {
    const url = this.joinUrl(`user/${userId}/change-email-address`);
    return this.serviceRequest.get(url);
  }
};

module.exports = ChangeEmailAddressService;
