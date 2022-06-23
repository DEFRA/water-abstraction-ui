const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const SupportedSourcesService = require('internal/lib/connectors/services/water/SupportedSourcesService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

experiment('services/water/SupportedSourcesService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getSupportedSources', () => {
    beforeEach(async () => {
      const service = new SupportedSourcesService('http://127.0.0.1:8001/water/1.0')
      await service.getSupportedSources()
    })

    test('calls the correct endpoint', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://127.0.0.1:8001/water/1.0/supported-sources')
    })
  })
})
