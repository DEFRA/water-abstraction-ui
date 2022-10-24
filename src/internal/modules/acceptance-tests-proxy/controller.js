'use strict'

const AcceptanceTestsProxyService = require('../../lib/connectors/services/water/AcceptanceTestsProxyService')

const config = require('../../config')
const { logger } = require('../../logger')

const postAcceptanceTestsProxy = async (request, h) => {
  const service = new AcceptanceTestsProxyService(config.services.water, logger)

  const result = await service.postToPath(request.params.tail, request.payload)

  return h.response(result)
}

module.exports = {
  postAcceptanceTestsProxy
}
