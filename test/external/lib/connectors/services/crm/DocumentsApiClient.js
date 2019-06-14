const DocumentsApiClient = require('external/lib/connectors/services/crm/DocumentsApiClient');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('lab').script();

const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('DocumentsApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      jwt: { token: 'test-jwt-token' },
      services: { crm: 'https://example.com/crm' },
      crm: {
        regimes: {
          water: {
            entityId: 'test-water-entity-id'
          }
        }
      }
    };

    client = new DocumentsApiClient(config, logger);

    sandbox.stub(client, 'findMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getLicenceCount', () => {
    beforeEach(async () => {
      client.findMany.resolves({
        pagination: {
          totalRows: 15
        }
      });
    });

    test('passes the expected filter to the documents API', async () => {
      await client.getLicenceCount('test-company-id');
      const [filter, , pagination] = client.findMany.lastCall.args;

      expect(filter).to.equal({ company_entity_id: 'test-company-id' });
      expect(pagination).to.equal({ page: 1, perPage: 1 });
    });

    test('resolves with the total number of rows', async () => {
      const result = await client.getLicenceCount('test-company-id');
      expect(result).to.equal(15);
    });

    test('rejects if the API returns an error response', async () => {
      client.findMany.resolves({
        error: 'bad news!'
      });
      const func = () => client.getLicenceCount('test-company-id');
      expect(func()).to.reject(); ;
    });
  });

  experiment('getUnregisteredLicences', () => {
    beforeEach(async () => {
      client.findMany.resolves({});
      const licenceNumbers = ['123'];
      await client.getUnregisteredLicences(licenceNumbers);
    });

    test('passes the expected query filter', async () => {
      const [filter] = client.findMany.lastCall.args;

      expect(filter).to.equal({
        'system_external_id': {
          $or: ['123']
        },
        company_entity_id: null,
        'metadata->IsCurrent': { $ne: 'false' }
      });
    });

    test('passes the expected sort object', async () => {
      const [, sort] = client.findMany.lastCall.args;
      expect(sort).to.equal({ system_external_id: 1 });
    });

    test('passes the expected pagination object', async () => {
      const [, , pagination] = client.findMany.lastCall.args;
      expect(pagination).to.equal({ page: 1, perPage: 300 });
    });
  });

  experiment('getUnregisteredLicencesByIds', () => {
    beforeEach(async () => {
      client.findMany.resolves({});
      const documentIds = ['2828-2222-2222'];
      await client.getUnregisteredLicencesByIds(documentIds);
    });

    test('passes the expected query filter', async () => {
      const [filter] = client.findMany.lastCall.args;

      expect(filter).to.equal({
        'document_id': {
          $or: ['2828-2222-2222']
        },
        company_entity_id: null,
        'metadata->IsCurrent': { $ne: 'false' }
      });
    });

    test('passes the expected sort object', async () => {
      const [, sort] = client.findMany.lastCall.args;
      expect(sort).to.equal({ system_external_id: 1 });
    });

    test('passes the expected pagination object', async () => {
      const [, , pagination] = client.findMany.lastCall.args;
      expect(pagination).to.equal({ page: 1, perPage: 300 });
    });
  });
});
