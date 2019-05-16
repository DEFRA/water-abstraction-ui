const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const returns = require('../../../../../src/external/lib/connectors/water-service/returns');
const serviceRequest = require('../../../../../src/shared/lib/connectors/service-request');
const config = require('../../../../../src/external/config');

const sandbox = sinon.createSandbox();

const eventId = 'event_1';
const returnId = 'return_1';
const qs = {
  entityId: 'entity_1',
  companyId: 'company_1',
  userName: 'user_1'
};

const responses = {
  error: {
    error: 'oh no'
  },
  multi: {
    error: null,
    data: [{
      returnId
    }]
  },
  single: {
    error: null,
    data: {
      returnId
    }
  }
};

experiment('getUploadPreview', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves(responses.multi);
    sandbox.stub(serviceRequest, 'post');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postUpload', () => {
    test('calls  serviceRequest.post with url, fileData and userName', async () => {
      await returns.postUpload('fileData', 'bob.jones@example.com');
      const [url, options] = serviceRequest.post.lastCall.args;
      expect(url).to.contain(['/returns/upload/xml']);
      expect(options.body).to.include({ fileData: 'fileData', userName: 'bob.jones@example.com' });
    });

    test('can upload different file types if specified in the third argument', async () => {
      await returns.postUpload('fileData', 'bob.jones@example.com', 'csv');
      const [url, options] = serviceRequest.post.lastCall.args;
      expect(url).to.contain(['/returns/upload/csv']);
      expect(options.body).to.include({ fileData: 'fileData', userName: 'bob.jones@example.com' });
    });

    test('should call service request with correct params', async () => {
      await returns.getUploadPreview(eventId, qs);
      const [uri, options] = serviceRequest.get.lastCall.args;
      expect(uri).to.equal(`http://127.0.0.1:8001/water/1.0/returns/upload-preview/${eventId}`);
      expect(options).to.equal({ qs });
    });

    test('should throw an error if API returns error response', async () => {
      serviceRequest.get.resolves(responses.error);
      const func = () => returns.getUploadPreview(eventId, qs);
      expect(func()).to.reject();
    });

    test('should resolve with data from API response', async () => {
      const response = await returns.getUploadPreview(eventId, qs);
      expect(response).to.equal(responses.multi.data);
    });

    test('should call service request with correct URL if return ID supplied', async () => {
      await returns.getUploadPreview(eventId, qs, returnId);
      const [uri] = serviceRequest.get.lastCall.args;
      expect(uri).to.equal(`http://127.0.0.1:8001/water/1.0/returns/upload-preview/${eventId}/${returnId}`);
    });
  });
});

experiment('postUploadSubmit', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'post').resolves({ error: null, data: { foo: 'bar' } });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('should call the water service with the correct params', async () => {
    await returns.postUploadSubmit(eventId, qs);
    const [uri, options] = serviceRequest.post.lastCall.args;
    expect(uri).to.equal(`${config.services.water}/returns/upload-submit/${eventId}`);
    expect(options.qs).to.equal(qs);
  });

  test('should resolve with data from the API call', async () => {
    const data = await returns.postUploadSubmit(eventId, qs);
    expect(data).to.equal({ foo: 'bar' });
  });

  test('should throw an error if the API response contains an error', async () => {
    serviceRequest.post.resolves({ error: 'oh no!' });
    const func = () => returns.postUploadSubmit(eventId, qs);
    expect(func()).to.reject();
  });
});
