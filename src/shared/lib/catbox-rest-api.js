/**
 * Provides a REST API strategy for Catbox, allowing it to store data in
 * the existing sessions table in the water service.
 * It is hoped this strategy will be only used temporarily and replaced
 * with the Redis store, which has a strategy available from the community.
 */
const { APIClient, throwIfError } = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

class CatboxRestAPI {
  constructor (options = {}) {
    this.options = options;
  }

  /**
   * Start the store
   */
  async start () {
    this.client = new APIClient(rp, {
      endpoint: `${process.env.WATER_URI}/sessions`,
      headers: {
        Authorization: process.env.JWT_TOKEN
      }
    });
  }

  /**
   * Stop the store
   */
  async stop () {
  }

  /**
   * Formats a Catbox key to a key which can be used by the store.
   * While we are only using Catbox for Yar, and since the API only supports
   * GUIDs, only the id part of the key is used.
   * For a full-fledged implementation the partition and segment would need
   * to be supported
   * @param  {String} key - the Catbox key of the item to store
   * @return {String}     - the key used in the REST API
   */
  _getKey (key) {
    return key.id;
  }

  /**
   * Gets a Catbox envelope object for the specified key
   * @param  {String} key - the Catbox key of the item to get
   * @return {Promise}      resolves with envelope if found, TTL not supported
   */
  async get (key) {
    const { error, data } = await this.client.findOne(this._getKey(key));

    if (error && error.name === 'NotFoundError') {
      return;
    };
    throwIfError(error);

    if (data) {
      // Map to catbox envelope object
      return {
        item: JSON.parse(data.session_data || '{}'),
        stored: data.date_updated || data.date_created
      };
    }
  }

  /**
   * Sets a data item for the specified Catbox key
   * @param  {String} key - the Catbox key of the item to get
   * @param {String|Object} value - the data to store
   * @return {Promise} resolves when API call completes
   */
  set (key, value) {
    const data = {
      session_id: this._getKey(key),
      session_data: JSON.stringify(value),
      ip: 'x'
    };
    return this.client.create(data);
  }

  /**
   * Deletes the key specified
   * @param  {String} key - the Catbox key of the item to delete
   * @return {Promise} resolves when API call completes
   */
  drop (key) {
    return this.client.delete(this._getKey(key));
  }

  /**
   * Whether the storage is ready.  Since the REST API is stateless, we always
   * return true
   * @return {Boolean}
   */
  isReady () {
    return true;
  }

  /**
   * Allows validation of segment names, however this is not supported
   * so we always return null rather than an error
   * @param  {String} segment - the segment name
   * @return {null|Error}
   */
  validateSegmentName (segment) {
    // Accept all segment names
    return null;
  }
}

module.exports = CatboxRestAPI;
