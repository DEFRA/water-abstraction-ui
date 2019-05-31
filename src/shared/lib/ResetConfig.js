/**
 * A class for providing options to the reset password HAPI plugin
 */

class ResetConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
    this.config = config;
  }

  _callIDMMethod (method, args) {
    const { application } = this.config.idm;
    return this.connectors.idm.users[method](application, ...args);
  }

  resetPassword () {
    return this._callIDMMethod('resetPassword', arguments);
  }

  getUserByResetGuid () {
    return this._callIDMMethod('getUserByResetGuid', arguments);
  }

  updatePasswordWithGuid () {
    return this._callIDMMethod('updatePasswordWithGuid', arguments);
  }
}

module.exports = ResetConfig;
