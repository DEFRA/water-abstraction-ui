const PicklistItemsApiClient = require('internal/lib/connectors/services/water/PicklistItemsApiClient');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('internal/services/PicklistItemsApiClient', () => {
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
        water: 'https://example.com/water'
      }
    };

    client = new PicklistItemsApiClient(config, logger);
    sandbox.stub(client, 'findAll');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/picklist-items');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });

  experiment('.getPicklistItems', () => {
    test('calls findAll with the expected filter', async () => {
      await client.getPicklistItems('p-id');
      const [filter] = client.findAll.lastCall.args;
      expect(filter).to.equal({
        picklist_id: 'p-id'
      });
    });
  });
});
