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
const uuid = require('uuid/v4');

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

  experiment('.getDocumentIdMap', async () => {
    let map;
    const LICENCE_A = '01/123';
    const LICENCE_B = '02/345';
    const response = {
      data: [
        {
          document_id: uuid(),
          system_external_id: LICENCE_A
        },
        {
          document_id: uuid(),
          system_external_id: LICENCE_B
        }
      ]
    };
    beforeEach(async () => {
      client.findMany.resolves(response);
      map = await client.getDocumentIdMap([LICENCE_A, LICENCE_B]);
    });

    test('call to .find uses correct filter', async () => {
      const [ filter ] = client.findMany.lastCall.args;
      expect(filter).to.equal({
        system_external_id: {
          $in: [LICENCE_A, LICENCE_B]
        }
      });
    });

    test('call to .find does not define a sort order', async () => {
      const [ , sort ] = client.findMany.lastCall.args;
      expect(sort).to.be.null();
    });

    test('call to .find gets all available records', async () => {
      const [ , , pagination ] = client.findMany.lastCall.args;
      expect(pagination).to.equal({
        page: 1,
        perPage: 9007199254740991
      });
    });

    test('call to .find only requests the columns needed', async () => {
      const [ , , , columns ] = client.findMany.lastCall.args;
      expect(columns).to.only.include(['system_external_id', 'document_id']);
    });

    test('resolved with a map of licence numbers to document IDs', async () => {
      expect(map instanceof Map).to.be.true();
      expect(map.size).to.equal(2);
      expect(map.get(LICENCE_A)).to.equal(response.data[0].document_id);
      expect(map.get(LICENCE_B)).to.equal(response.data[1].document_id);
    });
  });
});
