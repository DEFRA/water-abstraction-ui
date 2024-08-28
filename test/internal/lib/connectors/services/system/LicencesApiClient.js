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
const LicencesApiClient = require('../../../../../../src/internal/lib/connectors/services/system/LicencesApiClient.js')

experiment('services/system/LicencesApiClient', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post')
    service = new LicencesApiClient('http://127.0.0.1:8013')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.supplementary', () => {
    beforeEach(async () => {
      await service.supplementary('v1:6:01/115:10032782:2023-04-01:2024-03-31')
    })

    test('passes the expected URL to the service request', async () => {
      const url = serviceRequest.post.lastCall.args[0]

      expect(url).to.equal('http://127.0.0.1:8013/licences/supplementary')
    })

    test('passes the query in the request body', async () => {
      const options = serviceRequest.post.lastCall.args[1]

      expect(options.body).to.equal({ returnId: 'v1:6:01/115:10032782:2023-04-01:2024-03-31' })
    })
  })
})
