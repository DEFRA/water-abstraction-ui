/**
 * A class for providing options to the reset password HAPI plugin
 */

class ResetPasswordConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
    this.config = config;
  }

  _callIDMMethod (method, args) {
    const { application } = this.config.idm;
    return this.connectors.idm.users[method](application, ...args);
  }

  resetPassword (...args) {
    return this._callIDMMethod('resetPassword', args);
  }

  getUserByResetGuid (...args) {
    return this._callIDMMethod('getUserByResetGuid', args);
  }

  updatePasswordWithGuid (...args) {
    return this._callIDMMethod('updatePasswordWithGuid', args);
  }
}

module.exports = ResetPasswordConfig;
