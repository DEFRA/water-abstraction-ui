'use strict'

const SystemProxyService = require('../../lib/connectors/services/water/SystemProxyService')

const config = require('../../config')
const { logger } = require('../../logger')

/**
 * Forwards GET requests to the water-abstraction-system
 *
 * When the app runs in AWS you can't access the water-abstraction-service because port 8001 is not exposed. So, this
 * endpoint and controller in the app allows us to still run acceptance tests by providing a proxy to the internal API
 * service.
 *
 * The route is only added in our non-production environments.
 */
const getSystemProxy = async (request, h) => {
  const service = new SystemProxyService(config.services.system, logger)
  let result

  try {
    result = await service.getToPath(request.params.tail)
  } catch (error) {
    result = error.error
  }

  return h.response(result)
}

const getSystemJsProxy = async (request, h) => {
  let response

  const service = new SystemProxyService(config.services.system, logger)

  try {
    const result = await service.getToPath('assets/all.js')

    response = h.response(result)
      .header('cache-control', 'no-cache')
      .type('application/javascript')
  } catch (error) {
    response = h.response().code(error.statusCode)
  }

  return response
}

const getSystemCssProxy = async (request, h) => {
  let response

  const service = new SystemProxyService(config.services.system, logger)

  try {
    const result = await service.getToPath('assets/stylesheets/application.css')

    response = h.response(result)
      .header('cache-control', 'no-cache')
      .type('text/css')
  } catch (error) {
    response = h.response().code(error.statusCode)
  }

  return response
}

module.exports = {
  getSystemProxy,
  getSystemJsProxy,
  getSystemCssProxy
}
