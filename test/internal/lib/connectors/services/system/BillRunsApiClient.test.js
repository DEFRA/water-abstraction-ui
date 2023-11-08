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
const BillRunsApiClient = require('../../../../../../src/internal/lib/connectors/services/system/BillRunsApiClient.js')

experiment('services/system/BillRunsApiClient', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post')
    service = new BillRunsApiClient('http://127.0.0.1:8013')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.createBillRun', () => {
    beforeEach(async () => {
      await service.createBillRun({
        type: 'supplementary',
        scheme: 'sroc',
        region: 'fdf130c3-3021-408d-869c-2be1fb067e67',
        user: 'test@test.com',
        financialYearEnding: 2023
      })
    })

    test('passes the expected URL to the service request', async () => {
      const url = serviceRequest.post.lastCall.args[0]

      expect(url).to.equal('http://127.0.0.1:8013/bill-runs')
    })

    test('passes the query in the request body', async () => {
      const options = serviceRequest.post.lastCall.args[1]

      expect(options.body).to.equal({
        type: 'supplementary',
        scheme: 'sroc',
        region: 'fdf130c3-3021-408d-869c-2be1fb067e67',
        user: 'test@test.com',
        financialYearEnding: 2023,
        previousBillRunId: undefined
      })
    })
  })
})
