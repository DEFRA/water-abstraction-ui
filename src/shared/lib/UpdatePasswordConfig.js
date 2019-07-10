/**
 * A class for providing options to the update password HAPI plugin
 */

class UpdatePasswordConfig {
  constructor (config, connectors) {
    this.connectors = connectors;
    this.config = config;
  }

  _callIDMMethod (method, args) {
    const { application } = this.config.idm;
    return this.connectors.idm.users[method](application, ...args);
  }

  authenticate (...args) {
    return this._callIDMMethod('authenticate', args);
  }

  updatePassword (...args) {
    return this._callIDMMethod('updatePassword', args);
  }
}

module.exports = UpdatePasswordConfig;
