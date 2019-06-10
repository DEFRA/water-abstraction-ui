const DocumentVerificationApiClient = require('shared/lib/connectors/services/crm/DocumentVerificationApiClient');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('DocumentVerificationApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    sandbox.stub(serviceRequest, 'get').resolves({});

    logger = {};
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        crm: 'https://example.com/crm'
      }
    };

    client = new DocumentVerificationApiClient(config, logger);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/crm/document_verifications');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/crm');
    });
  });

  experiment('.getDocumentVerifications', () => {
    test('passes the expected URL to the request', async () => {
      const expectedUrl = `https://example.com/crm/document_verifications`;
      await client.getDocumentVerifications('test-id');

      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal(expectedUrl);
    });

    test('passes the expected filter query to the request', async () => {
      await client.getDocumentVerifications('test-id');

      const [, options] = serviceRequest.get.lastCall.args;
      const filter = JSON.parse(options.qs.filter);

      expect(filter).to.equal({
        document_id: 'test-id',
        'verification.date_verified': null
      });
    });
  });
});
