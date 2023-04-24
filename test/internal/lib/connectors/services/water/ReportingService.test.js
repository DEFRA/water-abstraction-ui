const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const {
  experiment,
  beforeEach,
  afterEach,
  test
} = exports.lab = require('@hapi/lab').script()
const { expect } = require('@hapi/code')

const ReportingService = require('internal/lib/connectors/services/water/ReportingService')
const { serviceRequest } = require('@envage/water-abstraction-helpers')

let got

experiment('services/water/ReportingService', () => {
  beforeEach(async () => {
    got = (await import('got')).got
    sandbox.stub(got, 'stream')
    sandbox.stub(serviceRequest, 'get')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getReport', () => {
    beforeEach(async () => {
      const service = new ReportingService('http://127.0.0.1:8001/water/1.0')
      await service.getReport(10101010, 'SomeReportEh')
    })

    test('calls the correct endpoint with the Got module', async () => {
      const [url] = got.stream.lastCall.args
      expect(url).to.equal('http://127.0.0.1:8001/water/1.0/report/SomeReportEh')
    })

    test('calls using the correct options', async () => {
      const [, options] = got.stream.lastCall.args
      expect(options.headers).to.equal({
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        'defra-internal-user-id': '10101010'
      })
    })
  })
})
