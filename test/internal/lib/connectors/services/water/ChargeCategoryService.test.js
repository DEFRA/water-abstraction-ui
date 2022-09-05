const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ChargeCategoryService = require('internal/lib/connectors/services/water/ChargeCategoryService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

experiment('services/water/ChargeCategoryService', () => {
  let service

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get')
    service = new ChargeCategoryService('https://example.com/water/1.0')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getChargeCategory', () => {
    test('passes the expected URL to the service request', async () => {
      const filter = { food: 'pizza', restaurant: 'Flazzo' }
      await service.getChargeCategory(filter)
      const [url, options] = serviceRequest.get.lastCall.args
      expect(url).to.equal('https://example.com/water/1.0/charge-categories')
      expect(options).to.equal({ qs: filter })
    })
  })
})
