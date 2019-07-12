const { omit } = require('lodash');
const WaterReturn = require('./models/WaterReturn');
const getSessionKey = request => `return_${request.query.returnId}`;

class FlowStorageAdapter {
  constructor (waterReturnsConnector) {
    this.waterReturnsConnector = waterReturnsConnector;
  }

  /**
   * Load return model data from session.  If not present, load it from
   * water returns service
   * @param  {Object}  request - HAPI request
   * @return {Promise<Object>} - water return model
   */
  async get (request) {
    const sessionKey = getSessionKey(request);
    let data = request.yar.get(sessionKey);

    // Load fresh return data if not in session
    if (!data) {
      // @TODO ensure permissions for external users
      data = await this.waterReturnsConnector.getReturn(request.query.returnId);
      request.yar.set(sessionKey, data);
    }

    return new WaterReturn(data);
  };

  /**
   * Save return model data to session
   * @param  {Object}  request - HAPI request
   * @param  {Object}  waterReturn - waterReturn instance
   */
  set (request, waterReturn) {
    const sessionKey = getSessionKey(request);
    return request.yar.set(sessionKey, waterReturn.toObject());
  };

  async submit (request, waterReturn) {
    const data = omit(waterReturn.toObject(), 'versions');
    await this.waterReturnsConnector.postReturn(data);
    const sessionKey = getSessionKey(request);
    request.yar.clear(sessionKey);
  }
}

module.exports = FlowStorageAdapter;
