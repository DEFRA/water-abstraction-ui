const VerificationsApiClient = require('external/lib/connectors/services/crm/VerificationsApiClient');

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
      jwt: { token: 'test-jwt-token' },
      services: { crm: 'https://example.com/crm' }
    };

    client = new VerificationsApiClient(config, logger);

    sandbox.stub(client, 'findMany');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getOutstandingVerifications', () => {
    test('passes the expected filter to the verifications API', async () => {
      await client.getOutstandingVerifications('test-entity-id');
      const [filter] = client.findMany.lastCall.args;

      expect(filter).to.equal({
        entity_id: 'test-entity-id',
        date_verified: null
      });
    });
  });
});
