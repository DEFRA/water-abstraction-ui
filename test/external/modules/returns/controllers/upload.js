const { expect } = require('code');
const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('lab').script();
const sinon = require('sinon');
const water = require('../../../../../src/external/lib/connectors/water');
const forms = require('../../../../../src/shared/lib/forms/index');
const files = require('../../../../../src/shared/lib/files');
const fileCheck = require('../../../../../src/external/lib/file-check');
const waterReturns = require('../../../../../src/external/lib/connectors/water-service/returns');
const waterCompany = require('../../../../../src/external/lib/connectors/water-service/company');

const controller = require('../../../../../src/external/modules/returns/controllers/upload');
const { logger } = require('../../../../../src/external/logger');
const uploadHelpers = require('../../../../../src/external/modules/returns/lib/upload-helpers');
const helpers = require('../../../../../src/external/modules/returns/lib/helpers.js');
const csvTemplates = require('../../../../../src/external/modules/returns/lib/csv-templates');

const sandbox = sinon.createSandbox();

const eventId = 'event_1';
const userName = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';
const companyName = 'Test Co Ltd.';
const csrfToken = 'csrf';
const returnId = 'v1:1:01/123:4567:2017-11-01:2018-10-31';

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
      file: '<xml>'
    },
    defra: {
      userName,
      entityId,
      companyId,
      companyName
    }
  };
};

const createSpinnerRequest = () => {
  const request = createRequest();
  set(request, 'params.status', 'processing');
  return request;
};

const createErrorResponse = () => {
  return {
    error: 'oh no',
    data: null
  };
};

const createResponse = (status, metadata) => ({
  error: null,
  data: [{
    status,
    metadata
  }]
});

const returns = [{
  returnId,
  isNil: true,
  errors: []
}, {
  returnId,
  isNil: true,
  errors: ['oh no']
}];

const companyReturns = [{
  returnId: 'v1:123',
  startDate: '2018-04-01',
  endDate: '2019-03-31',
  returnRequirement: '01234',
  status: 'due',
  frequency: 'week'
}];

const csvData = {
  day: [['foo', 'bar']]
};

const zipObject = { zip: true };

experiment('upload controller', () => {
  let h;
  let header;

  beforeEach(async () => {
    header = sandbox.stub().returnsThis();

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      response: sandbox.stub().returns({
        header
      })
    };
    sandbox.stub(water.events, 'findMany');
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(uploadHelpers, 'getFile').returns('filepath');
    sandbox.stub(uploadHelpers, 'uploadFile');
    sandbox.stub(uploadHelpers, 'getUploadedFileStatus');
    sandbox.stub(waterReturns, 'postUpload').resolves({ data: { eventId } });
    sandbox.stub(files, 'deleteFile');
    sandbox.stub(files, 'readFile').returns('fileData');
    sandbox.stub(waterReturns, 'postUploadSubmit');
    sandbox.stub(waterCompany, 'getCurrentDueReturns').resolves(companyReturns);
    sandbox.stub(csvTemplates, 'createCSVData').returns(csvData);
    sandbox.stub(csvTemplates, 'buildZip').resolves(zipObject);
    sandbox.stub(fileCheck, 'detectFileType').resolves('xml');
    sandbox.stub(helpers, 'getReturnsViewData').returns({ xmlUser: true });
  });
  afterEach(async () => {
    sandbox.restore();
  });
  experiment('getXmlUpload', () => {
    test('it should display the upload xml page', async () => {
      const request = createRequest();
      await controller.getXmlUpload(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/upload.njk');
      expect(view.form.action).to.equal('/returns/upload');
    });
  });
  experiment('postXmlUpload', () => {
    test('it should redirect to spinner page if there are no errors', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(uploadHelpers.fileStatuses.OK);
      await controller.postXmlUpload(createRequest(), h);

      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/returns/processing-upload/processing/${eventId}`);
    });

    test('it should redirect to same page with virus error message if virus', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(uploadHelpers.fileStatuses.VIRUS);
      await controller.postXmlUpload(createRequest(), h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=virus');
    });

    test('it should redirect to same page with file type message if unsupported file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(uploadHelpers.fileStatuses.INVALID_TYPE);
      await controller.postXmlUpload(createRequest(), h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=invalid-type');
    });

    test('it should call the water returns upload API with the correct file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(uploadHelpers.fileStatuses.OK);
      fileCheck.detectFileType.resolves('csv');
      await controller.postXmlUpload(createRequest(), h);
      const [data, user, fileType] = waterReturns.postUpload.lastCall.args;
      expect(data).to.equal('fileData');
      expect(user).to.equal('user_1');
      expect(fileType).to.equal('csv');
    });
  });
  experiment('getSpinnerPage', () => {
    test('throws an error if there is an error response from the events API', async () => {
      const response = createErrorResponse();
      water.events.findMany.resolves(response);
      const func = () => controller.getSpinnerPage(createSpinnerRequest(), h);
      expect(func()).to.reject();
    });

    test('it should redirect to the summary page if status is validated', async () => {
      const response = createResponse('validated');
      const request = createSpinnerRequest();
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(request, h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/returns/upload-summary/${request.params.event_id}`);
    });

    test('it should load the waiting page', async () => {
      const response = createResponse();
      const request = createSpinnerRequest();
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(request, h);

      const [path] = h.view.lastCall.args;
      expect(path).to.equal(`nunjucks/waiting/index.njk`);
    });

    test('throws a Boom 404 error if the event is not found', async () => {
      water.events.findMany.resolves({ error: null, data: [] });
      try {
        await controller.getSpinnerPage(createSpinnerRequest(), h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(404);
      }
    });

    test('if status === "error", it should redirect to upload page with the key in the query string', async () => {
      const response = createResponse('error', { 'error': { key: 'invalid-xml', message: 'Schema Check failed' } });
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(createSpinnerRequest(), h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=invalid-xml');
    });
  });

  experiment('XML return upload controller', () => {
    let request;

    beforeEach(async () => {
      sandbox.stub(logger, 'error');
      sandbox.stub(logger, 'info');
      request = createRequest();
    });

    afterEach(async () => {
      sandbox.restore();
    });

    experiment('getSummary', () => {
      beforeEach(async () => {
        sandbox.stub(waterReturns, 'getUploadPreview').resolves(returns);
      });

      test('should call water returns API with correct params', async () => {
        await controller.getSummary(request, h);
        const { args } = waterReturns.getUploadPreview.lastCall;
        expect(args[0]).to.equal(eventId);
        expect(args[1]).to.equal({
          userName,
          entityId,
          companyId
        });
      });

      test('should use the correct template', async () => {
        await controller.getSummary(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/returns/upload-summary.njk');
      });

      test('should set the correct view data', async () => {
        await controller.getSummary(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.pageTitle).to.equal(controller.pageTitles.error);
        expect(view.back).to.equal('/returns/upload');
        expect(view.returnsWithErrors).to.be.an.array();
        expect(view.returnsWithoutErrors).to.be.an.array();
        expect(view.form).to.be.an.object();
      });

      test('should have correct page title if there are no errors', async () => {
        waterReturns.getUploadPreview.resolves([returns[0]]);
        await controller.getSummary(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.pageTitle).to.equal(controller.pageTitles.ok);
      });

      test('should log an error if water returns API error', async () => {
        waterReturns.getUploadPreview.rejects();
        const func = () => controller.getSummary(request, h);
        await expect(func()).to.reject();

        const [message, params] = logger.error.lastCall.args;
        expect(message).to.be.a.string();
        expect(params).to.equal({
          eventId,
          options: {
            userName,
            entityId,
            companyId
          }
        });
      });

      test('redirects to upload form if upload contains no data', async () => {
        waterReturns.getUploadPreview.resolves([]);
        await controller.getSummary(request, h);
        expect(h.redirect.calledWith(`/returns/upload?error=empty`)).to.equal(true);
      });
    });

    experiment('getSummaryReturn', () => {
      beforeEach(async () => {
        sandbox.stub(waterReturns, 'getUploadPreview').resolves(returns[0]);
      });

      test('should call water returns API with correct params', async () => {
        await controller.getSummaryReturn(request, h);
        const { args } = waterReturns.getUploadPreview.lastCall;
        expect(args[0]).to.equal(eventId);
        expect(args[1]).to.equal({
          userName,
          entityId,
          companyId
        });
        expect(args[2]).to.equal(returnId);
      });

      test('should output correct view data', async () => {
        await controller.getSummaryReturn(request, h);
        const [, view] = h.view.lastCall.args;
        expect(view.back).to.equal(`/returns/upload-summary/${eventId}`);
        expect(view.return).to.be.an.object();
        expect(view.pageTitle).to.be.a.string();
        expect(view.lines).to.be.an.array();
      });

      test('should log an error if water returns API error', async () => {
        waterReturns.getUploadPreview.rejects();
        const func = () => controller.getSummaryReturn(request, h);
        await expect(func()).to.reject();

        const [message, params] = logger.error.lastCall.args;
        expect(message).to.be.a.string();
        expect(params).to.equal({
          eventId,
          returnId,
          options: {
            userName,
            entityId,
            companyId
          }
        });
      });
    });

    experiment('postSubmit', () => {
      test('should call the water service upload submit API with correct params', async () => {
        const request = createRequest();
        await controller.postSubmit(request, h);
        const { args } = waterReturns.postUploadSubmit.lastCall;
        expect(args[0]).to.equal(eventId);
        expect(args[1]).to.equal({
          companyId,
          entityId,
          userName
        });
      });

      test('should redirect to the correct URL if the API call succeeds', async () => {
        const request = createRequest();
        await controller.postSubmit(request, h);
        const [path] = h.redirect.lastCall.args;
        expect(path).to.equal(`/returns/processing-upload/submitting/${eventId}`);
      });

      test('should log an error if the submission fails', async () => {
        waterReturns.postUploadSubmit.rejects();
        const func = () => controller.postSubmit(request, h);
        await expect(func()).to.reject();
        const [message, params] = logger.error.lastCall.args;
        expect(message).to.be.a.string();
        expect(params).to.equal({
          eventId,
          options: {
            entityId,
            userName,
            companyId
          }
        });
      });
    });

    experiment('getSubmitted', () => {
      test('should render a success page', async () => {
        const request = createRequest();
        await controller.getSubmitted(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/returns/upload-submitted.njk');
      });

      test('should log an info message', async () => {
        const request = createRequest();
        await controller.getSubmitted(request, h);
        const [message, params] = logger.info.lastCall.args;
        expect(message).to.be.a.string();
        expect(params).to.equal({ eventId });
      });
    });

    experiment('getCSVTemplates', () => {
      beforeEach(async () => {
        const request = createRequest();
        await controller.getCSVTemplates(request, h);
      });

      test('should get current due returns for the correct company', async () => {
        expect(waterCompany.getCurrentDueReturns.calledWith(companyId)).to.equal(true);
      });

      test('calls csvTemplates.createCSVData with the company returns', async () => {
        expect(csvTemplates.createCSVData.calledWith(companyReturns)).to.equal(true);
      });

      test('calls csvTemplates.buildZip with CSV data and company name', async () => {
        const { args } = csvTemplates.buildZip.lastCall;
        expect(args[0]).to.equal(csvData);
        expect(args[1]).to.equal(companyName);
      });

      test('responds with the zip stream', async () => {
        expect(h.response.calledWith(zipObject)).to.equal(true);
      });

      test('sets the correct mime type header in the response', async () => {
        const [key, value] = header.firstCall.args;
        expect(key).to.equal('Content-type');
        expect(value).to.equal('application/zip');
      });

      test('sets the correct content disposition in the response', async () => {
        const [key, value] = header.secondCall.args;
        expect(key).to.equal('Content-disposition');
        expect(value).to.equal('attachment; filename=test_co_ltd.zip');
      });
    });
  });

  experiment('getUploadInstructions', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getUploadInstructions(request, h);
    });

    test('should render the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/upload-instructions.njk');
    });
  });
});
