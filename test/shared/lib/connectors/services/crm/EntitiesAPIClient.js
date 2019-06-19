const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const EntitiesAPIClient = require('../../../../../../src/shared/lib/connectors/services/crm/EntitiesAPIClient');
const rp = sandbox.stub();
const client = new EntitiesAPIClient(rp, {
  endpoint: 'http://test-endpoint'
});

experiment('Shared EntitiesAPIClient', () => {
  const userName = ' BOB@example.com ';
  const entity = {
    entity_id: 'entity_1',
    entity_type: 'individual',
    entity_nm: 'bob@example.com'
  };

  beforeEach(async () => {
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
