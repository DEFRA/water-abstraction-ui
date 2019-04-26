const { expect } = require('code');
const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('lab').script();
const sinon = require('sinon');
const water = require('../../../../src/lib/connectors/water.js');
const forms = require('../../../../src/lib/forms/index');
const files = require('../../../../src/lib/files');
const waterReturns = require('../../../../src/lib/connectors/water-service/returns');

const controller = require('../../../../src/modules/returns/controllers/upload');
const logger = require('../../../../src/lib/logger');
const uploadHelpers = require('../../../../src/modules/returns/lib/upload-helpers');

const sandbox = sinon.createSandbox();

const eventId = 'event_1';
const userName = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';
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
    auth: {
      credentials: {
        username: userName,
        entity_id: entityId,
        companyId
      }
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

experiment('upload controller', () => {
  let h;
  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
    sandbox.stub(water.events, 'findMany');
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(uploadHelpers, 'getFile').returns('filepath');
    sandbox.stub(uploadHelpers, 'uploadFile');
    sandbox.stub(uploadHelpers, 'getUploadedFileStatus');
    sandbox.stub(waterReturns, 'postXML').returns({ data: { eventId } });
    sandbox.stub(files, 'deleteFile');
    sandbox.stub(files, 'readFile').returns('fileData');
    sandbox.stub(waterReturns, 'postUploadSubmit');
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

    test('it should redirect to same page with XML error message if not XML', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(uploadHelpers.fileStatuses.NOT_XML);
      await controller.postXmlUpload(createRequest(), h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=notxml');
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
  });
});
