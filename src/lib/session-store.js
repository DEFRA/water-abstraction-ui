/**
 * Provides a session storage class linked to a REST
 * API (actual storage is in water project)
 * @module lib/sessions/session-store
 */
const { APIClient } = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const logger = require('./logger');

class NoSessionCookieError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NoSessionCookieError';
  }
}

/**
  * @class SessionStore
  */
class SessionStore {
  /**
   * Constructor
   * @param {Object} HAPI HTTP request
   */
  constructor (request) {
    this.request = request;
    // @TODO
    this.apiClient = new APIClient(rp, {
      endpoint: `${process.env.WATER_URI}/sessions`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    });
    // Initialise session data
    this.sessionId = null;
    this.data = {};
    this.isDirty = false;
  }

  /**
   * Create a session for the current user via API call
   * resolves with the session data (including session_id)
   * @return {Promise} resolves with newly created session ID
   */
  async create (sessionData = {}) {
    const { data, error } = await this.apiClient.create({
      session_data: JSON.stringify(sessionData),
      ip: this.request.info.remoteAddress
    });
    if (error) {
      throw error;
    }
    this.sessionId = data.session_id;
    this.data = JSON.parse(data.session_data);
    this.isDirty = false;
    return data.session_id;
  }

  /**
   * Load current session data
   * @return {Promise} resolves with session data
   */
  async load () {
    const sessionId = this.getSessionCookieId();
    const { data, error } = await this.apiClient.findOne(sessionId);
    if (error) {
      throw error;
    }
    this.data = JSON.parse(data.session_data);
    this.isDirty = false;
  }

  /**
   * Set a value in the session store
   * @param {String} key - the session key value
   * @param {Mixed} value- the session value to set
   * @return {Object} all session data
   */
  set (key, value) {
    this.data[key] = value;
    this.isDirty = true;
    return this.data;
  }

  /**
   * Delete a value in the session store
   * @param {String} key - the session key value
   * @return {Object} all session data
   */
  delete (key) {
    delete this.data[key];
    this.isDirty = true;
    return this.data;
  }

  /**
   * Get a value from the session store
   * @param {String} key - the session key value
   * @return {Mixed} - session value
   */
  get (key) {
    return this.data[key];
  }

  /**
   * Save current session data if dirty
   * Throws error if error saving data via API
   */
  async save () {
    if (!this.isDirty) {
      return;
    }
    const sessionId = this.getSessionCookieId();
    const { error } = await this.apiClient.updateOne(sessionId, {
      session_data: JSON.stringify(this.data)
    });
    if (error) {
      throw error;
    }
  }

  /**
   * Gets the session cookie ID - throws an error if not found
   * @return {String}
   */
  getSessionCookieId () {
    if ('sid' in this.request.state) {
      return this.request.state.sid.sid;
    }
    throw new NoSessionCookieError('Session cookie not found');
  }

  /**
   * Destroy the current session
   * throws error if API error
   */
  async destroy () {
    const sessionId = this.getSessionCookieId();
    logger.log('info', `Destroy session ${sessionId}`);
    const {error} = await this.apiClient.delete(sessionId);
    if (error) {
      throw error;
    }
    this.sessionId = null;
    this.data = {};
    this.isDirty = false;
  }
}

module.exports = SessionStore;
