'use strict'

// Test framework dependencies
const Lab = require('@hapi/lab')
const Code = require('@hapi/code')
const Sinon = require('sinon')

const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script()
const { expect } = Code
const sandbox = Sinon.createSandbox()

// Things we need to stub
const { serviceRequest } = require('@envage/water-abstraction-helpers')

// Thing under test
const BillingAccountsApiClient = require('../../../../../../src/internal/lib/connectors/services/system/BillingAccountsApiClient.js')

experiment('services/system/BillingAccountsApiClient', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post')
    service = new BillingAccountsApiClient('http://127.0.0.1:8013')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.changeAddress', () => {
    beforeEach(async () => {
      await service.changeAddress(
        '89dfe495-69b3-4643-b8f5-8a59016ccec7',
        {
          address: { addressLine1: 'Horizon House' }
        }
      )
    })

    test('passes the expected URL to the service request', async () => {
      const url = serviceRequest.post.lastCall.args[0]

      expect(url).to.equal('http://127.0.0.1:8013/billing-accounts/89dfe495-69b3-4643-b8f5-8a59016ccec7/change-address')
    })

    test('passes the query in the request body', async () => {
      const options = serviceRequest.post.lastCall.args[1]

      expect(options.body).to.equal({
        address: { addressLine1: 'Horizon House' }
      })
    })
  })
})
