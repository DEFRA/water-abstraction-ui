const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ReturnsService = require('internal/lib/connectors/services/water/ReturnsService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

experiment('services/water/ReturnsService', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'patch')
    sandbox.stub(serviceRequest, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.patchReturn', () => {
    beforeEach(async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0')
      await service.patchReturn({
        extra: 'to-remove',
        returnId: 'r-1',
        status: 'due',
        receivedDate: 'rec-date',
        user: 'user-1',
        isUnderQuery: true
      })
    })

    test('passes the expected URL to the service request', async () => {
      const expectedUrl = 'http://127.0.0.1:8001/water/1.0/returns/header'
      const [url] = serviceRequest.patch.lastCall.args
      expect(url).to.equal(expectedUrl)
    })

    test('passes the correct options data to the service request', async () => {
      const expectedOptions = {
        qs: { returnId: 'r-1' },
        body: {
          returnId: 'r-1',
          status: 'due',
          receivedDate: 'rec-date',
          user: 'user-1',
          isUnderQuery: true
        }
      }
      const [, options] = serviceRequest.patch.lastCall.args

      expect(options).to.equal(expectedOptions)
    })
  })

  experiment('.getIncompleteReturns', () => {
    beforeEach(async () => {
      const service = new ReturnsService('http://127.0.0.1:8001/water/1.0')
      await service.getIncompleteReturns(['123/ABC', '456/CDE'])
    })

    test('calls the correct endpoint', async () => {
      const [url] = serviceRequest.get.lastCall.args
      expect(url).to.equal('http://127.0.0.1:8001/water/1.0/returns/incomplete')
    })

    test('uses the correct options', async () => {
      const [, options] = serviceRequest.get.lastCall.args

      const expectedOptions = {
        qs: { licenceNumbers: ['123/ABC', '456/CDE'] },
        qsStringifyOptions: { arrayFormat: 'repeat' }
      }

      expect(options).to.equal(expectedOptions)
    })
  })
})
