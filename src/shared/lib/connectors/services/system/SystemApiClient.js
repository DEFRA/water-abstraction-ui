'use strict'

const { APIClient } = require('@envage/hapi-pg-rest-api')
const { http } = require('@envage/water-abstraction-helpers')

class SystemApiClient extends APIClient {
  /**
   * Create a new instance of a SystemApiClient
   * @param {Object} config Object containing the services.system url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.system

    super(http.request, {
      serviceUrl,
      endpoint: serviceUrl,
      logger,
      headers: {
        Authorization: config.jwt.token
      }
    })
  }
}

module.exports = SystemApiClient
