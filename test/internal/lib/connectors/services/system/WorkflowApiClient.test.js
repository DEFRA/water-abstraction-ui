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
const WorkflowApiClient = require('../../../../../../src/internal/lib/connectors/services/system/WorkflowApiClient.js')

experiment('services/system/WorkflowApiClient', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post')
    service = new WorkflowApiClient('http://127.0.0.1:8013')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.supplementary', () => {
    beforeEach(async () => {
      await service.supplementary('eac49574-f9cc-4619-8807-2a759018728b')
    })

    test('passes the expected URL to the service request', async () => {
      const url = serviceRequest.post.lastCall.args[0]

      expect(url).to.equal('http://127.0.0.1:8013/licences/supplementary')
    })

    test('passes the query in the request body', async () => {
      const options = serviceRequest.post.lastCall.args[1]

      expect(options.body).to.equal({ workflowId: 'eac49574-f9cc-4619-8807-2a759018728b' })
    })
  })
})
