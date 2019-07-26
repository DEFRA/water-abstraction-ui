const DocumentsApiClient = require('shared/lib/connectors/services/crm/DocumentsApiClient');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('DocumentsApiClient', () => {
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
      },
      crm: {
        regimes: {
          water: {
            entityId: 'test-water-entity-id'
          }
        }
      }
    };

    client = new DocumentsApiClient(config, logger);

    sandbox.stub(client, 'updateOne').resolves({});
    sandbox.stub(client, 'findMany').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/crm/documentHeader');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/crm');
    });

    test('adds the water regime entity id to the config', async () => {
      expect(client.config.waterRegimeEntityId).to.equal('test-water-entity-id');
    });
  });

  experiment('.setLicenceName', () => {
    test('passes the expected arguments to updateOne', async () => {
      await client.setLicenceName('test-doc-id', 'new-name');
      const [documentId, patch] = client.updateOne.lastCall.args;
      expect(documentId).to.equal('test-doc-id');
      expect(patch).to.equal({
        document_name: 'new-name'
      });
    });
  });

  experiment('.getWaterLicence', async () => {
    beforeEach(async () => {
      client.findMany.resolves({
        error: null,
        data: [{}]
      });
    });

    test('includeExpired is false by default', async () => {
      await client.getWaterLicence('test');
      const [filter] = client.findMany.lastCall.args;
      expect(filter.system_external_id).to.equal('test');
      expect(filter.includeExpired).to.be.false();
    });

    test('includeExpired is true if set', async () => {
      await client.getWaterLicence('test', true);
      const [filter] = client.findMany.lastCall.args;
      expect(filter.system_external_id).to.equal('test');
      expect(filter.includeExpired).to.be.true();
    });
  });
});
