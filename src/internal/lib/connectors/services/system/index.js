'use strict'

// Internal services
const BillingAccountsApiClient = require('./BillingAccountsApiClient.js')
const BillRunsApiClient = require('./BillRunsApiClient.js')
const LicencesApiClient = require('./LicencesApiClient.js')
const ReturnsApiClient = require('./ReturnsApiClient.js')

const { logger } = require('../../../../logger')

module.exports = config => ({
  billingAccounts: new BillingAccountsApiClient(config.services.system, logger),
  billRuns: new BillRunsApiClient(config.services.system, logger),
  licences: new LicencesApiClient(config.services.system, logger),
  returns: new ReturnsApiClient(config.services.system, logger)
})
