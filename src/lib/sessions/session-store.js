/**
 * Provides a session storage class linked to a REST
 * API (actual storage is in water project)
 * @module lib/sessions/session-store
 */
const { APIClient } = require('hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false,
});

/**
  * @class SessionStore
  */
class SessionStore {
  /**
   * Constructor
   * @param {Object} HAPI HTTP request
   */
  constructor(request) {
    this.request = request;
    // @TODO
    this.apiClient = new APIClient(rp, {
      endpoint: `${ process.env.WATER_URI }/sessions`,
      headers: {
        Authorization: process.env.JWT_TOKEN,
      },
    });
  }


  /**
   * Create a session for the current user via API call
   * resolves with the session data (including session_id)
   * @return {Promise} resolves with newly created session ID
   */
  async create(sessionData = {}) {
    const { data, error } = await this.apiClient.create({
      session_data: JSON.stringify(sessionData),
      ip: this.request.info.remoteAddress,
    });
    if (error) {
      throw error;
    }
    return data.session_id;
  }

  /**
   * Load current session data
   * @return {Promise} resolves with session data
   */
  async load() {
    const sessionId = this.request.auth.credentials.sid;
    const { data, error } = await this.apiClient.findOne(sessionId);
    if (error) {
      throw error;
    }
    return JSON.parse(data.session_data);
  }

  /**
   * Save current session data
   * Throws error if issue
   */
  async save(data = {}) {
    const sessionId = this.request.auth.credentials.sid;
    const { error } = await this.apiClient.updateOne(sessionId, {
      session_data: JSON.stringify(data),
    });
    if (error) {
      throw error;
    }
  }
}


module.exports = SessionStore;
