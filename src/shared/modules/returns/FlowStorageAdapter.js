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

    return data;
  };

  /**
   * Save return model data to session
   * @param  {Object}  request - HAPI request
   * @param  {Object}  data    - return model data
   */
  set (request, data) {
    const sessionKey = getSessionKey(request);
    console.log('Set', sessionKey, data);
    return request.yar.set(sessionKey, data);
  };

  submit () {

  }
}

module.exports = FlowStorageAdapter;
