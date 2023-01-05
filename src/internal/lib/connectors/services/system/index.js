'use strict'

// Internal services
const BillRunsService = require('./BillRunsService.js')

const { logger } = require('../../../../logger')

module.exports = config => ({
  billRuns: new BillRunsService(config.services.system, logger)
})
