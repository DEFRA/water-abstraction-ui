const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const water = require('../../../../src/lib/connectors/water.js');
const forms = require('../../../../src/lib/forms/index');
const files = require('../../../../src/lib/files');
const returns = require('../../../../src/lib/connectors/water-service/returns.js');

const controller = require('../../../../src/modules/returns/controllers/upload');
const uploadHelpers = require('../../../../src/modules/returns/lib/upload-helpers');

const sandbox = sinon.createSandbox();

const createRequest = () => {
  return {
    view: sandbox.stub(),
    query: {
      error: undefined
    },
    payload: {
      file: 'file'
    },
    params: {
      event_id: '934nfo5-dfndfkh45'
    },
    auth: {
      credentials: {
        username: 'bob.jones@gmail.com'
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

const createResponse = status => ({
  error: null,
  data: {
    status
  }
});

experiment('upload controller', () => {
  let h;
  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
    sandbox.stub(water.events, 'findOne');
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(uploadHelpers, 'getFile').returns('filepath');
    sandbox.stub(uploadHelpers, 'uploadFile');
    sandbox.stub(uploadHelpers, 'runChecks');
    sandbox.stub(returns, 'postXML').returns({ data: { eventId: 'kjdr46-w38rjg34' } });
    sandbox.stub(files, 'deleteFile');
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
      const request = createRequest();
      await controller.postXmlUpload(request, h);

      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/returns/processing-upload/kjdr46-w38rjg34');
    });

    test('it should redirect to same page with error message if error', async () => {
      const request = createRequest();
      uploadHelpers.runChecks.returns('/test/url');
      await controller.postXmlUpload(request, h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/test/url');
    });
  });
  experiment('getSpinnerPage', () => {
    test('throws an error if there is an error response from the events API', async () => {
      const response = createErrorResponse();
      water.events.findOne.resolves(response);
      const func = () => controller.getSpinnerPage(createRequest(), h);
      expect(func()).to.reject();
    });

    test('it should redirect to the summary page if status is validated', async () => {
      const response = createResponse('validated');
      const request = createRequest();
      water.events.findOne.resolves(response);
      await controller.getSpinnerPage(request, h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/returns/upload-summary/${request.params.event_id}`);
    });

    test('it should redirect to errors page if status is error ', async () => {
      const response = createResponse('error');
      const request = createRequest();
      water.events.findOne.resolves(response);
      await controller.getSpinnerPage(request, h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/returns/upload-errors/${request.params.event_id}`);
    });
  });
});
