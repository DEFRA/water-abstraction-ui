const { expect } = require('@hapi/code');
const { set } = require('lodash');
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const services = require('internal/lib/connectors/services');
const forms = require('shared/lib/forms');
const UploadHelpers = require('shared/lib/upload-helpers');
const files = require('shared/lib/files');
const fileCheck = require('shared/lib/file-check');
const { logger } = require('internal/logger');
const controller = require('internal/modules/charge-information-upload/controller');

const eventId = 'event_1';
const userName = 'user_1';
const filename = 'filename_1.csv';
const csrfToken = 'csrf';

const createRequest = () => {
  return {
    view: {
      csrfToken
    },
    params: {
      eventId
    },
    query: {
      filename
    },
    payload: {
      file: { hapi: { filename } }
    },
    defra: {
      userName
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
    event_id: eventId,
    status,
    metadata
  }]
});
experiment('external/modules/charge-information/controllers/upload', () => {
  let header, h, request;

  beforeEach(async () => {
    header = sandbox.stub().returnsThis();

    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      response: sandbox.stub().returns({
        header
      })
    };

    request = createRequest();

    sandbox.stub(services.water.events, 'findMany');
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(UploadHelpers.prototype, 'getFile').returns('filepath');
    sandbox.stub(UploadHelpers.prototype, 'uploadFile');
    sandbox.stub(UploadHelpers.prototype, 'getUploadedFileStatus');
    sandbox.stub(UploadHelpers.prototype, 'createDirectory');
    sandbox.stub(services.water.chargeVersions, 'postUpload').resolves({ data: { eventId } });
    sandbox.stub(files, 'deleteFile');
    sandbox.stub(files, 'readFile').returns('fileData');
    sandbox.stub(fileCheck, 'detectFileType').resolves('csv');
    sandbox.stub(logger, 'errorWithJourney');
    sandbox.stub(logger, 'error');
    sandbox.stub(logger, 'info');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getUploadChargeInformation', () => {
    test('it should display the upload charge information page', async () => {
      const response = createResponse();
      services.water.events.findMany.resolves(response);
      await controller.getUploadChargeInformation(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/charge-information/upload');
      expect(view.form.action).to.equal('/charge-information/upload');
    });
  });

  experiment('.postUploadChargeInformation', () => {
    const { OK, VIRUS, INVALID_TYPE } = UploadHelpers.fileStatuses;
    const uploadHelpers = new UploadHelpers('test-upload', ['csv'], services, logger);

    test('redirects to spinner page if there are no errors', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(OK);
      await controller.postUploadChargeInformation(request, h);

      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/charge-information/processing-upload/processing/${eventId}?filename=${filename}`);
    });

    test('redirects to same page with virus error message if virus', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(VIRUS);
      await controller.postUploadChargeInformation(request, h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/charge-information/upload?error=virus');
    });

    test('redirects to same page with file type message if unsupported file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(INVALID_TYPE);
      await controller.postUploadChargeInformation(request, h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/charge-information/upload?error=invalid-type');
    });

    test('redirects to same page with no file message if no filename is provided', async () => {
      await controller.postUploadChargeInformation({
        ...request,
        payload: {
          file: {
            hapi: {
              filename: ''
            }
          }
        }
      }, h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/charge-information/upload?error=no-file');
    });

    test('does not redirect a no file page if the filename is set', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(INVALID_TYPE);
      await controller.postUploadChargeInformation({
        ...request,
        payload: {
          file: {
            hapi: {
              filename: 'test.csv'
            }
          }
        }
      }, h);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal('/charge-information/upload?error=invalid-type');
    });

    test('calls the water returns upload API with the correct file type', async () => {
      uploadHelpers.getUploadedFileStatus.resolves(OK);
      fileCheck.detectFileType.resolves('csv');
      await controller.postUploadChargeInformation(request, h);
      const args = services.water.chargeVersions.postUpload.lastCall.args;
      expect(args).to.equal(['fileData', userName, filename, 'csv']);
    });

    test('logs the journey data if there is an error', async () => {
      await uploadHelpers.createDirectory.rejects();
      try {
        await controller.postUploadChargeInformation(request);
      } catch (err) {
        expect(logger.errorWithJourney.called).to.be.true();
      }
    });
  });

  experiment('.getSpinnerPage', () => {
    test('throws an error if there is an error response from the events API', async () => {
      const response = createErrorResponse();
      services.water.events.findMany.resolves(response);
      const func = () => controller.getSpinnerPage(createSpinnerRequest(), h);
      expect(func()).to.reject();
    });

    test('it should redirect to the summary page if status is validated', async () => {
      const response = createResponse('ready');
      const request = createSpinnerRequest();
      services.water.events.findMany.resolves(response);
      await controller.getSpinnerPage(request, h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/charge-information/upload/${eventId}`);
    });

    test('it should load the waiting page', async () => {
      const response = createResponse('processing', { statusMessage: 'STATUS MESSAGE' });
      const request = createSpinnerRequest();
      services.water.events.findMany.resolves(response);
      await controller.getSpinnerPage(request, h);

      const args = h.view.lastCall.args;
      expect(args).to.equal([
        'nunjucks/waiting/index',
        { csrfToken, pageTitle: `Uploading ${filename}`, statusMessage: 'STATUS MESSAGE' }
      ]);
    });

    test('throws a Boom 404 error if the event is not found', async () => {
      services.water.events.findMany.resolves({ error: null, data: [] });
      try {
        await controller.getSpinnerPage(createSpinnerRequest(), h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(404);
      }
    });

    test('if status === "error", it should redirect to upload page with the key in the query string', async () => {
      const response = createResponse('error', { error: { key: 'invalid-csv', message: 'Schema Check failed' } });
      services.water.events.findMany.resolves(response);
      await controller.getSpinnerPage(createSpinnerRequest(), h);

      expect(h.redirect.callCount).to.equal(1);
      const [path] = h.redirect.lastCall.args;
      expect(path).to.equal(`/charge-information/upload/${eventId}?error=invalid-csv`);
    });
  });
});
