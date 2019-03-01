const sinon = require('sinon');
const Lab = require('lab');
const returns = require('../../../../src/lib/connectors/water-service/returns.js');
const serviceRequest = require('../../../../src/lib/connectors/service-request');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');

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
  });

  afterEach(async () => {
    sandbox.restore();
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
