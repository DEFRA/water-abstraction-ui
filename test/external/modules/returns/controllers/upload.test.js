const { expect } = require('@hapi/code')
const { set } = require('lodash')
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('@hapi/lab').script()
const sinon = require('sinon')
const sandbox = sinon.createSandbox()

const forms = require('shared/lib/forms/index')
const files = require('shared/lib/files')
const fileCheck = require('shared/lib/file-check')
const services = require('external/lib/connectors/services')

const controller = require('external/modules/returns/controllers/upload')
const { logger } = require('external/logger')

const UploadHelpers = require('shared/lib/upload-helpers')
const uploadSummaryHelpers = require('external/modules/returns/lib/upload-summary-helpers')
const helpers = require('external/modules/returns/lib/helpers.js')
const csvTemplates = require('external/modules/returns/lib/csv-templates')

const eventId = 'event_1'
const userName = 'user_1'
const entityId = 'entity_1'
const companyId = 'company_1'
const companyName = 'Test Co Ltd.'
const csrfToken = 'csrf'
const returnId = 'v1:1:01/123:4567:2017-11-01:2018-10-31'

const createRequest = () => {
  return {
    view: {
      csrfToken
    },
    params: {
      eventId,
      returnId
    },
    payload: {
      file: '<csv>'
    },
    defra: {
      userName,
      entityId,
      companyId,
      companyName
    }
  }
}

const createSpinnerRequest = () => {
  const request = createRequest()
  set(request, 'params.status', 'processing')
  return request
}

const createErrorResponse = () => {
  return {
    error: 'oh no',
    data: null
  }
}

const createResponse = (status, metadata) => ({
  error: null,
  data: [{
    status,
    metadata
  }]
})

const returns = [{
  returnId,
  isNil: true,
  errors: []
}, {
  returnId,
  isNil: true,
  errors: ['oh no']
}]

const companyReturns = [{
  returnId: 'v1:123',
  startDate: '2018-04-01',
  endDate: '2019-03-31',
  returnRequirement: '01234',
  status: 'due',
  frequency: 'week'
}]

const csvData = {
  day: [['foo', 'bar']]
}

const zipObject = { zip: true }

experiment('external/modules/returns/controllers/upload', () => {
  let header, h, request

  beforeEach(async () => {
    header = sandbox.stub().returnsThis()

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      response: sandbox.stub().returns({
        header
      })
    }

    request = createRequest()

    sandbox.stub(services.water.events, 'findMany')
    sandbox.stub(forms, 'handleRequest')
    sandbox.stub(UploadHelpers.prototype, 'getFile').returns('filepath')
    sandbox.stub(UploadHelpers.prototype, 'uploadFile')
    sandbox.stub(UploadHelpers.prototype, 'getUploadedFileStatus')
    sandbox.stub(UploadHelpers.prototype, 'createDirectory')
    sandbox.stub(uploadSummaryHelpers, 'mapRequestOptions').returns({ userName, entityId, companyId })
    sandbox.stub(uploadSummaryHelpers, 'groupReturns')
    sandbox.stub(services.water.returns, 'postUpload').resolves({ data: { eventId } })
    sandbox.stub(files, 'deleteFile')
    sandbox.stub(files, 'readFile').returns('fileData')
    sandbox.stub(services.water.returns, 'postUploadSubmit')
    sandbox.stub(services.water.companies, 'getCurrentDueReturns').resolves(companyReturns)
    sandbox.stub(csvTemplates, 'createCSVData').returns(csvData)
    sandbox.stub(csvTemplates, 'buildZip').resolves(zipObject)
    sandbox.stub(fileCheck, 'detectFileType').resolves('csv')
    sandbox.stub(helpers, 'getReturnsViewData').returns({ csvUser: true })
    sandbox.stub(logger, 'errorWithJourney')
    sandbox.stub(logger, 'error')
    sandbox.stub(logger, 'info')
  })

  afterEach(async () => {
    sandbox.restore()
  })

  experiment('.getBulkUpload', () => {
    test('it should display the upload csv page', async () => {
      await controller.getBulkUpload(request, h)
      const [template, view] = h.view.lastCall.args

      expect(template).to.equal('nunjucks/returns/upload')
      expect(view.form.action).to.equal('/returns/upload')
    })
  })

  experiment('.postBulkUpload', () => {
    const { OK, VIRUS, INVALID_TYPE } = UploadHelpers.fileStatuses
    const uploadHelpers = new UploadHelpers('test-upload', ['csv'], services, logger)

    test('redirects to spinner page if there are no errors', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(OK)
      await controller.postBulkUpload(request, h)

      const [path] = h.redirect.lastCall.args
      expect(path).to.equal(`/returns/processing-upload/processing/${eventId}`)
    })

    test('redirects to same page with virus error message if virus', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(VIRUS)
      await controller.postBulkUpload(request, h)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal('/returns/upload?error=virus')
    })

    test('redirects to same page with file type message if unsupported file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(INVALID_TYPE)
      await controller.postBulkUpload(request, h)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal('/returns/upload?error=invalid-type')
    })

    test('redirects to same page with no file message if no filename is provided', async () => {
      await controller.postBulkUpload({
        ...request,
        payload: {
          file: {
            hapi: {
              filename: ''
            }
          }
        }
      }, h)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal('/returns/upload?error=no-file')
    })

    test('does not redirect a no file page if the filename is set', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(INVALID_TYPE)
      await controller.postBulkUpload({
        ...request,
        payload: {
          file: {
            hapi: {
              filename: 'test.csv'
            }
          }
        }
      }, h)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal('/returns/upload?error=invalid-type')
    })

    test('calls the water returns upload API with the correct file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(OK)
      fileCheck.detectFileType.resolves('csv')
      await controller.postBulkUpload(request, h)
      const [data, user, compId, fileType] = services.water.returns.postUpload.lastCall.args
      expect(data).to.equal('fileData')
      expect(user).to.equal('user_1')
      expect(compId).to.equal('company_1')
      expect(fileType).to.equal('csv')
    })

    test('logs the journey data if there is an error', async () => {
      await uploadHelpers.createDirectory.rejects()
      try {
        await controller.postBulkUpload(request)
      } catch (err) {
        expect(logger.errorWithJourney.called).to.be.true()
      }
    })
  })

  experiment('.getSpinnerPage', () => {
    test('throws an error if there is an error response from the events API', async () => {
      const response = createErrorResponse()
      services.water.events.findMany.resolves(response)
      const func = () => controller.getSpinnerPage(createSpinnerRequest(), h)
      expect(func()).to.reject()
    })

    test('it should redirect to the summary page if status is validated', async () => {
      const response = createResponse('ready')
      const request = createSpinnerRequest()
      services.water.events.findMany.resolves(response)
      await controller.getSpinnerPage(request, h)

      expect(h.redirect.callCount).to.equal(1)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal(`/returns/upload-summary/${request.params.event_id}`)
    })

    test('it should load the waiting page', async () => {
      const response = createResponse()
      const request = createSpinnerRequest()
      services.water.events.findMany.resolves(response)
      await controller.getSpinnerPage(request, h)

      const [path] = h.view.lastCall.args
      expect(path).to.equal('nunjucks/waiting/index')
    })

    test('throws a Boom 404 error if the event is not found', async () => {
      services.water.events.findMany.resolves({ error: null, data: [] })
      try {
        await controller.getSpinnerPage(createSpinnerRequest(), h)
        fail()
      } catch (err) {
        expect(err.isBoom).to.equal(true)
        expect(err.output.statusCode).to.equal(404)
      }
    })

    test('if status === "error", it should redirect to upload page with the key in the query string', async () => {
      const response = createResponse('error', { error: { key: 'invalid-csv', message: 'Schema Check failed' } })
      services.water.events.findMany.resolves(response)
      await controller.getSpinnerPage(createSpinnerRequest(), h)

      expect(h.redirect.callCount).to.equal(1)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal('/returns/upload?error=invalid-csv')
    })
  })

  experiment('.getSummary', () => {
    beforeEach(async () => {
      const metadata = { validationResults: returns }
      const response = createResponse('ready', metadata)
      const returnsWithErrors = [returns[1]]
      const returnsWithoutErrors = [returns[0]]
      uploadSummaryHelpers.groupReturns.returns({ returnsWithErrors, returnsWithoutErrors })
      services.water.events.findMany.resolves(response)
    })

    test('gets options from uploadSummaryHelpers', async () => {
      await controller.getSummary(request, h)
      const [req] = uploadSummaryHelpers.mapRequestOptions.lastCall.args
      expect(req).to.equal(request)
    })

    test('loads the upload event', async () => {
      await controller.getSummary(request, h)
      const [filter] = services.water.events.findMany.lastCall.args
      expect(filter).to.equal({
        event_id: eventId,
        issuer: userName,
        type: 'returns-upload'
      })
    })

    test('calls groupReturns upload summary helper with expected params', async () => {
      await controller.getSummary(request, h)
      const [validationResults, evtId] = uploadSummaryHelpers.groupReturns.lastCall.args
      expect(validationResults).to.equal(returns)
      expect(evtId).to.equal(eventId)
    })

    test('redirects to error page if no returns data is returns from uploadSummaryHelpers', async () => {
      uploadSummaryHelpers.groupReturns.returns([])
      await controller.getSummary(request, h)
      expect(h.redirect.calledWith('/returns/upload?error=empty')).to.be.true()
    })

    test('should use the correct template', async () => {
      await controller.getSummary(request, h)
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/upload-summary')
    })

    test('should set the correct view data', async () => {
      await controller.getSummary(request, h)
      const [, view] = h.view.lastCall.args
      expect(view.pageTitle).to.equal(controller.pageTitles.error)
      expect(view.back).to.equal('/returns/upload')
      expect(view.returnsWithErrors).to.be.an.array()
      expect(view.returnsWithoutErrors).to.be.an.array()
      expect(view.form).to.be.an.object()
    })

    test('should have correct page title if there are no errors', async () => {
      uploadSummaryHelpers.groupReturns.returns({ returnsWithoutErrors: [returns[0]] })
      await controller.getSummary(request, h)
      const [, view] = h.view.lastCall.args
      expect(view.pageTitle).to.equal(controller.pageTitles.ok)
    })

    test('should log an error if water returns API error', async () => {
      services.water.events.findMany.rejects()
      const func = () => controller.getSummary(request, h)
      await expect(func()).to.reject()

      const [message, , , params] = logger.errorWithJourney.lastCall.args
      expect(message).to.be.a.string()
      expect(params).to.equal({
        eventId,
        options: {
          userName,
          entityId,
          companyId
        }
      })
    })
  })

  experiment('.getSummaryReturn', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.returns, 'getUploadPreview').resolves(returns[0])
    })

    test('should call water returns API with correct params', async () => {
      await controller.getSummaryReturn(request, h)
      const { args } = services.water.returns.getUploadPreview.lastCall
      expect(args[0]).to.equal(eventId)
      expect(args[1]).to.equal({
        userName,
        entityId,
        companyId
      })
      expect(args[2]).to.equal(returnId)
    })

    test('should output correct view data', async () => {
      await controller.getSummaryReturn(request, h)
      const [, view] = h.view.lastCall.args
      expect(view.back).to.equal(`/returns/upload-summary/${eventId}`)
      expect(view.return).to.be.an.object()
      expect(view.pageTitle).to.be.a.string()
      expect(view.lines).to.be.an.array()
    })

    test('should log an error if water returns API error', async () => {
      services.water.returns.getUploadPreview.rejects()
      const func = () => controller.getSummaryReturn(request, h)
      await expect(func()).to.reject()

      const [message, , , params] = logger.errorWithJourney.lastCall.args
      expect(message).to.be.a.string()
      expect(params).to.equal({
        eventId,
        returnId,
        options: {
          userName,
          entityId,
          companyId
        }
      })
    })
  })

  experiment('.postSubmit', () => {
    test('should call the water service upload submit API with correct params', async () => {
      await controller.postSubmit(request, h)
      const { args } = services.water.returns.postUploadSubmit.lastCall
      expect(args[0]).to.equal(eventId)
      expect(args[1]).to.equal({
        companyId,
        entityId,
        userName
      })
    })

    test('should redirect to the correct URL if the API call succeeds', async () => {
      await controller.postSubmit(request, h)
      const [path] = h.redirect.lastCall.args
      expect(path).to.equal(`/returns/processing-upload/submitting/${eventId}`)
    })

    test('should log an error if the submission fails', async () => {
      services.water.returns.postUploadSubmit.rejects()
      const func = () => controller.postSubmit(request, h)
      await expect(func()).to.reject()
      const [message, err, , params] = logger.errorWithJourney.lastCall.args
      expect(message).to.be.a.string()
      expect(err).to.be.an.error()
      expect(params).to.equal({
        eventId,
        options: {
          entityId,
          userName,
          companyId
        }
      })
    })
  })

  experiment('.getSubmitted', () => {
    test('should render a success page', async () => {
      await controller.getSubmitted(request, h)
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/upload-submitted')
    })

    test('should log an info message', async () => {
      await controller.getSubmitted(request, h)
      const [message, params] = logger.info.lastCall.args
      expect(message).to.be.a.string()
      expect(params).to.equal({ eventId })
    })
  })

  experiment('.getCSVTemplates', () => {
    experiment('when there are returns', () => {
      beforeEach(async () => {
        await controller.getCSVTemplates(request, h)
      })

      test('should get current due returns for the correct company', async () => {
        expect(services.water.companies.getCurrentDueReturns.calledWith(companyId)).to.equal(true)
      })

      test('calls csvTemplates.createCSVData with the company returns', async () => {
        expect(csvTemplates.createCSVData.calledWith(companyReturns)).to.equal(true)
      })

      test('calls csvTemplates.buildZip with CSV data and company name', async () => {
        const { args } = csvTemplates.buildZip.lastCall
        expect(args[0]).to.equal(csvData)
        expect(args[1]).to.equal(companyName)
      })

      test('responds with the zip stream', async () => {
        expect(h.response.calledWith(zipObject)).to.equal(true)
      })

      test('sets the correct mime type header in the response', async () => {
        const [key, value] = header.firstCall.args
        expect(key).to.equal('Content-type')
        expect(value).to.equal('application/zip')
      })

      test('sets the correct content disposition in the response', async () => {
        const [key, value] = header.secondCall.args
        expect(key).to.equal('Content-disposition')
        expect(value).to.equal('attachment; filename="test co ltd return templates.zip"')
      })
    })

    experiment('when there are no returns', () => {
      beforeEach(async () => {
        services.water.companies.getCurrentDueReturns.resolves([])
      })

      test('a Boom 404 error is thrown', async () => {
        try {
          await controller.getCSVTemplates(request, h)
          fail()
        } catch (err) {
          expect(err.isBoom).to.be.true()
          expect(err.output.statusCode).to.equal(404)
        }
      })
    })
  })

  experiment('.getUploadInstructions', () => {
    beforeEach(async () => {
      await controller.getUploadInstructions(request, h)
    })

    test('should render the correct template', async () => {
      const [template] = h.view.lastCall.args
      expect(template).to.equal('nunjucks/returns/upload-instructions')
    })
  })
})
