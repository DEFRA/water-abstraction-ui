const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const EntitiesApiClient = require('shared/lib/connectors/services/crm/EntitiesApiClient');

experiment('Shared EntitiesApiClient', () => {
  let logger;
  let config;
  let client;

  const userName = ' BOB@example.com ';
  const entity = {
    entity_id: 'entity_1',
    entity_type: 'individual',
    entity_nm: 'bob@example.com'
  };

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

    client = new EntitiesApiClient(config, logger);

    sandbox.stub(client, 'findMany').resolves({
      error: null,
      data: [ entity ]
    });

    sandbox.stub(client, 'create').resolves({
      error: null,
      data: entity
    });
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/crm/entity');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/crm');
    });
  });

  experiment('getOrCreateIndividual', () => {
    test('should call client.findMany with correct filter', async () => {
      await client.getOrCreateIndividual(userName);
      expect(client.findMany.calledWith({
        entity_nm: 'bob@example.com',
        entity_type: 'individual'
      })).to.equal(true);
    });

    test('throws error if API error response', async () => {
      client.findMany.resolves({ error: 'oh no!' });
      const func = () => client.getOrCreateIndividual(userName);
      expect(func()).to.reject();
    });

    test('throws error if more than 1 entity found with same name', async () => {
      client.findMany.resolves({
        error: null,
        data: [entity, entity]
      });
      const func = () => client.getOrCreateIndividual(userName);
      expect(func()).to.reject();
    });

    test('resolves with CRM response if 1 record found', async () => {
      const result = await client.getOrCreateIndividual(userName);
      expect(result).to.equal(entity);
    });

    experiment('if CRM entity not found', async () => {
      beforeEach(async () => {
        client.findMany.resolves({ error: null, data: [] });
      });

      test('call to create CRM entity has correct data', async () => {
        await client.getOrCreateIndividual(userName);
        expect(client.create.calledWith(entity));
      });

      test('resolves with the created CRM entity object', async () => {
        const result = await client.getOrCreateIndividual(userName);
        expect(result).to.equal(entity);
      });

      test('throws error if API error response', async () => {
        client.create.resolves({ error: 'oh no!' });
        const func = () => client.getOrCreateIndividual(userName);
        expect(func()).to.reject();
      });
    });
  });
});
