'use strict'

// Internal services
const BillingAccountsApiClient = require('./BillingAccountsApiClient.js')
const BillRunsApiClient = require('./BillRunsApiClient.js')
const LicencesApiClient = require('./LicencesApiClient.js')
const WorkflowApiClient = require('./WorkflowApiClient.js')

const { logger } = require('../../../../logger')

module.exports = config => ({
  billingAccounts: new BillingAccountsApiClient(config.services.system, logger),
  billRuns: new BillRunsApiClient(config.services.system, logger),
  licences: new LicencesApiClient(config.services.system, logger),
  workflow: new WorkflowApiClient(config.services.system, logger)
})
