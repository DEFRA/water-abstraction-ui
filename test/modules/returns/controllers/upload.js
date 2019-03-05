const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
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
    auth: {
      credentials: {
        username: userName,
        entity_id: entityId,
        companyId
      }
    }
  };
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
    sandbox.stub(uploadHelpers, 'runChecks');
    sandbox.stub(waterReturns, 'postXML').returns({ data: { eventId: 'kjdr46-w38rjg34' } });
    sandbox.stub(files, 'deleteFile');
    sandbox.stub(files, 'readFile').returns('fileData');
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
      await controller.postXmlUpload(createRequest(), h);

      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/processing-upload/entityId');
    });

    test('it should redirect to same page with error message if error', async () => {
      uploadHelpers.runChecks.returns('/test/url');
      await controller.postXmlUpload(createRequest(), h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/test/url');
    });
  });
  experiment('getSpinnerPage', () => {
    test('throws an error if there is an error response from the events API', async () => {
      const response = createErrorResponse();
      water.events.findMany.resolves(response);
      const func = () => controller.getSpinnerPage(createRequest(), h);
      expect(func()).to.reject();
    });

    test('it should redirect to the summary page if status is validated', async () => {
      const response = createResponse('validated');
      const request = createRequest();
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(request, h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/returns/upload-summary/${request.params.event_id}`);
    });

    test('it should redirect to upload page with "uploaderror"', async () => {
      const response = createResponse('undefined');
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(createRequest(), h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=uploaderror');
    });

    test('if status === "error", it should redirect to upload page with "invalid-xml" error', async () => {
      const response = createResponse('error', { 'error': { key: 'invalid-xml', message: 'Schema Check failed' } });
      water.events.findMany.resolves(response);
      await controller.getSpinnerPage(createRequest(), h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/upload?error=invalidxml');


experiment('XML return upload controller', () => {
  const h = {
    view: sandbox.stub()
  };
  let request;

  beforeEach(async () => {
    sandbox.stub(logger, 'error');
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
});
