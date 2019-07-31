/**
 * A class for providing options to the update password HAPI plugin
 */

class UpdatePasswordConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
    this.config = config;
  }

  /**
   * Attempts to authenticate a user
   *
   * @param {string} email The email/username
   * @param {string} password The user password
   */
  authenticate (email, password) {
    const { application } = this.config.idm;
    return this.connectors.idm.users.authenticate(email, password, application);
  }

  /**
   * Updates a user's password
   *
   * @param {number} userId The id of the user whose password is to be updated
   * @param {string} password The new password for the user
   */
  updatePassword (userId, password) {
    const { application } = this.config.idm;
    return this.connectors.idm.users.updatePassword(application, userId, password);
  }
}

module.exports = UpdatePasswordConfig;
