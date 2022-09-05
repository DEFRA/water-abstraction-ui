const sinon = require('sinon')
const { expect } = require('@hapi/code')
const Lab = require('@hapi/lab')
const { experiment, test, afterEach, beforeEach, fail } = exports.lab = Lab.script()
const sandbox = sinon.createSandbox()

const controller = require('external/modules/returns/controllers/view')
const helpers = require('external/modules/returns/lib/helpers')
const services = require('external/lib/connectors/services')
const WaterReturn = require('shared/modules/returns/models/WaterReturn')

const request = {
  query: {
    id: 'test-id',
    version: 1
  },
  params: {
    documentId: 'test-document-id'
  },
  defra: {
    entityId: 'test-entity-id'
  }
}

const h = {
  view: sandbox.stub()
}

const testData = isCurrent => {
  return {
    licenceNumber: '123-abc',
    isCurrent,
    lines: [{
      startDate: '2020-11-01',
      endDate: '2020-11-30',
      timePeriod: 'month'
    }],
    meters: [{}],
    metadata: {
      isCurrent
    },
    startDate: '2020-11-01',
    endDate: '2021-10-31',
    frequency: 'month'
  }
}

experiment('external view controller', () => {
  beforeEach(() => {
    sandbox.stub(helpers, 'getReturnsViewData')
    sandbox.stub(helpers, 'getNewTaggingLicenceNumbers')
    sandbox.stub(services.water.returns, 'getReturn')
    sandbox.stub(WaterReturn.prototype, 'constructor')
  })

  afterEach(async () => { sandbox.restore() })

  experiment('getReturns', () => {
    beforeEach(async () => {
      helpers.getReturnsViewData.returns({ test: 'data' })
      await controller.getReturns(request, h)
    })
    test('correct template is passed', async () => {
      const [template, view] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/index')
      expect(view).to.equal({ test: 'data' })
    })
  })

  experiment('getReturnsForLicence', () => {
    test('correct template is passed', async () => {
      helpers.getReturnsViewData.returns({ document: { system_external_id: 'lic-1234' } })
      await controller.getReturnsForLicence(request, h)

      const [template, view] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/licence')
      expect(view).to.contain(['back', 'backText', 'document', 'pageTitle', 'paginationUrl'])
      expect(view.back).to.equal(`/licences/${request.params.documentId}`)
      expect(view.backText).to.equal(`Licence number ${view.document.system_external_id}`)
      expect(view.document).to.equal({ system_external_id: 'lic-1234' })
      expect(view.pageTitle).to.equal(`Returns for licence number ${view.document.system_external_id}`)
      expect(view.paginationUrl).to.equal(`/licences/${request.params.documentId}/returns`)
    })

    test('throws a Boom 404 error if the document is not found', async () => {
      const errorMessage = `Document ${request.params.documentId} not found - entity ${request.defra.entityId} may not have the correct roles`
      helpers.getReturnsViewData.returns({})
      try {
        await controller.getReturnsForLicence(request, h)
        fail()
      } catch (err) {
        expect(err.isBoom).to.equal(true)
        expect(err.message).to.equal(errorMessage)
        expect(err.output.statusCode).to.equal(404)
      }
    })
  })

  experiment('getReturn', () => {
    beforeEach(async () => {
      helpers.getNewTaggingLicenceNumbers.returns([{ documentHeader: 'test-doc-header' }])
      WaterReturn.prototype.constructor.returns({ metadata: { isCurrent: true } })
    })
    test('correct template is passed', async () => {
      const returnData = testData(true)
      services.water.returns.getReturn.returns(returnData)
      await controller.getReturn(request, h)

      const [template, view] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/return')
      expect(view.data.isCurrent).to.equal(returnData.isCurrent)
      expect(view.data.licenceNumber).to.equal(returnData.licenceNumber)
      expect(view.data.lines).to.be.an.array().length(12)
      expect(view.data.lines[0]).to.equal(returnData.lines[0])
      expect(view.data.metadata).to.equal(returnData.metadata)
    })

    test('Boom error is thrown if !canView', async () => {
      services.water.returns.getReturn.returns(testData(false))
      try {
        await controller.getReturn(request, h)
      } catch (err) {
        expect(err.isBoom).to.be.true()
        expect(err.message).to.equal('Access denied return test-id for entity test-entity-id')
      }
    })
  })
})
