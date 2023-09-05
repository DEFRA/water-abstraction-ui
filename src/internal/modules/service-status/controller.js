'use strict'

const config = require('../../config.js')

const getServiceStatus = async (_request, h) => {
  const healthInfoUrl = new URL('/health/info', config.services.system)

  return h.redirect(healthInfoUrl)
}

exports.getServiceStatus = getServiceStatus
