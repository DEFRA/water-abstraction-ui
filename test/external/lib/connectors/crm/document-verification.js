const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();

const serviceRequest = require('../../../../../src/shared/lib/connectors/service-request');
const crmConnector = require('../../../../../src/external/lib/connectors/crm/document-verification');

experiment('getDocumentVerifications', () => {
  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('passes the expected URL to the request', async () => {
    await crmConnector.getDocumentVerifications('test-id');
    const expectedUrl = `${process.env.CRM_URI}/document_verifications`;
    const [url] = serviceRequest.get.lastCall.args;
    expect(url).to.equal(expectedUrl);
  });

  test('passes the expected filter query to the request', async () => {
    await crmConnector.getDocumentVerifications('test-id');
    const [, options] = serviceRequest.get.lastCall.args;
    const filter = JSON.parse(options.qs.filter);
    expect(filter).to.equal({
      document_id: 'test-id',
      'verification.date_verified': null
    });
  });
});
