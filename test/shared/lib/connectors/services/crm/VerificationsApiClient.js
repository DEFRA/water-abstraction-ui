const VerificationsApiClient = require('shared/lib/connectors/services/crm/VerificationsApiClient');
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

experiment('VerificationsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      jwt: {
        token: 'test-jwt-token'
      },
      services: {
        crm: 'https://example.com/crm'
      }
    };

    client = new VerificationsApiClient(config, logger);
    sandbox.stub(serviceRequest, 'get').resolves({});
    sandbox.stub(serviceRequest, 'post').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/crm/verification');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/crm');
    });
  });

  experiment('.addDocuments', () => {
    let documentIds;

    beforeEach(async () => {
      documentIds = ['123', '123321'];
      await client.addDocuments('test-id', documentIds);
    });

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal('https://example.com/crm/verification/test-id/documents');
    });

    test('passes the expected body to the request', async () => {
      const [, options] = serviceRequest.post.lastCall.args;
      expect(options.body.document_id).to.equal(documentIds);
    });
  });

  experiment('.getDocuments', () => {
    beforeEach(async () => {
      await client.getDocuments('test-id');
    });

    test('passes the expected URL to the request', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('https://example.com/crm/verification/test-id/documents');
    });
  });
});
