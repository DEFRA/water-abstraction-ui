const { throwIfError, APIClient } = require('@envage/hapi-pg-rest-api');
const serviceRequest = require('shared/lib/connectors/service-request');

class UsersAPIClient extends APIClient {
  /**
   * Authenticates a user with the IDM for the application specified in
   * the config object
   * Resolves with a user record from IDM
   * @param  {String}  email    - user email address
   * @param  {String}  password - user password
   * @param  {String}  application - the application to use for authentication
   * @return {Promise<Object>} resolves with object including success flag
   */
  async authenticate (email, password, application) {
    try {
      const uri = `${this.config.endpoint}/login`;

      const response = await serviceRequest.post(uri, {
        body: {
          user_name: email,
          password,
          application
        }
      });

      return response;
    } catch (error) {
      // Unauthorized
      if (error.statusCode === 401) {
        return { user_id: null };
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
  async findOneByEmail (email, application) {
    const { error, data: [ user ] } = await this.findMany({
      user_name: email,
      application
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
