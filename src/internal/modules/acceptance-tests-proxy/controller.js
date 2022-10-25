'use strict'

const AcceptanceTestsProxyService = require('../../lib/connectors/services/water/AcceptanceTestsProxyService')

const config = require('../../config')
const { logger } = require('../../logger')

/**
 * Forwards acceptance test related the POST requests to the water-abstraction-service
 *
 * The water-abstraction-service has the ability to add test data, and 'tear-down' anything it's created. Everything is
 * done on the http://localhost:8001/water/1.0/acceptance-tests/ path. Our acceptance tests depend on access to this
 * path in order to work.
 *
 * When the app runs in AWS you can't access the water-abstraction-service because port 8001 is not exposed. So, this
 * endpoint and controller in the app allows us to still run acceptance tests by providing a proxy to the internal API
 * service.
 *
 * The route is only added in our non-production environments.
 */
const postAcceptanceTestsProxy = async (request, h) => {
  const service = new AcceptanceTestsProxyService(config.services.water, logger)
  let result

  try {
    result = await service.postToPath(request.params.tail, request.payload)
  } catch (error) {
    result = error.error
  }

  return h.response(result)
}

module.exports = {
  postAcceptanceTestsProxy
}
