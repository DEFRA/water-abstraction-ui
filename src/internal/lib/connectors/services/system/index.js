'use strict'

// Internal services
const BillRunsApiClient = require('./BillRunsApiClient.js')

const { logger } = require('../../../../logger')

module.exports = config => ({
  billRuns: new BillRunsApiClient(config.services.system, logger)
})
