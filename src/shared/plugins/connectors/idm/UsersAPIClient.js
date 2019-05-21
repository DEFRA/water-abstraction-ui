const { throwIfError, APIClient } = require('@envage/hapi-pg-rest-api');
const serviceRequest = require('shared/lib/connectors/service-request');

class UsersAPIClient extends APIClient {
  /**
   * Authenticates a user with the IDM for the application specified in
   * the config object
   * Resolves with an object with the structure:
   * { success : false, resetRequired : true, resetGuid : 'xxx' }
   * @param  {String}  email    - user email address
   * @param  {String}  password - user password
   * @return {Promise<Object>} resolves with object including success flag
   */
  async authenticate (email, password) {
    try {
      const uri = `${this.config.endpoint}/login`;

      const response = await serviceRequest.post(uri, {
        body: {
          user_name: email,
          password,
          application: this.config.application
        }
      });

      return {
        success: !!response.user_id,
        resetRequired: response.reset_required,
        resetGuid: response.reset_guid
      };
    } catch (error) {
      // Unauthorized
      if (error.statusCode === 401) {
        return { success: false };
      }
      // Throw other errors
      throw error;
    }
  };

  /**
   * Finds a user by email address within the application specified in the
   * config
   * @param  {String}  email    - user email address
   * @return {Promise}       resolves with user object from IDM
   */
  async findOneByEmail (email) {
    const { error, data: [ user ] } = await this.findMany({
      user_name: email,
      application: this.config.application
    });
    throwIfError(error);
    return user;
  }

  /**
   * Update the external_id field for the given user
   * @param {object} user - The user
   * @param {String} externalId - The crm entity id
   * @return {Promise}
   */
  updateExternalId (user, externalId) {
    if (user.external_id) {
      return;
    }
    return this.updateOne(user.user_id, { external_id: externalId });
  };
}

module.exports = UsersAPIClient;
