const PicklistsApiClient = require('internal/lib/connectors/services/water/PicklistsApiClient');

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('internal/services/PicklistsApiClient', () => {
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

    client = new PicklistsApiClient(config, logger);

    sandbox.stub(client, 'findOne').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/water/picklists');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/water');
    });
  });

  experiment('.getPicklist', () => {
    test('returns the result data', async () => {
      client.findOne.resolves({
        error: null,
        data: {
          picklist_id: 'p-id',
          name: 'Test List'
        }
      });

      const result = await client.getPicklist('p-id');

      expect(result.name).to.equal('Test List');
    });

    test('throws if the picklist is not found', async () => {
      client.findOne.resolves({
        error: {
          name: 'bad-news'
        },
        data: null
      });

      const err = await expect(client.getPicklist('p-id')).to.reject();
      expect(err.output.statusCode).to.equal(500);
    });
  });
});
