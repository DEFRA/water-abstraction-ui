const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const UsersApiClient = require('external/lib/connectors/services/idm/UsersApiClient');

experiment('external/UsersApiClient', () => {
  let logger;
  let config;
  let client;

  beforeEach(async () => {
    logger = {};
    config = {
      services: {
        idm: 'https://example.com/idm'
      },
      jwt: {
        token: 'test-jwt-token'
      }
    };
    client = new UsersApiClient(config, logger);

    sandbox.stub(client, 'create').resolves({});
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('construction', () => {
    test('creates the expected endpoint URL', async () => {
      expect(client.getUrl()).to.equal('https://example.com/idm/user');
    });

    test('sets the JWT in the client headers', async () => {
      expect(client.config.headers.Authorization).to.equal('test-jwt-token');
    });

    test('adds the base service URL to the config', async () => {
      expect(client.config.serviceUrl).to.equal('https://example.com/idm');
    });
  });

  experiment('createUserWithoutPassword', () => {
    let createArgs;
    const uuidRE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/;

    beforeEach(async () => {
      await client.createUserWithoutPassword('test-application', 'TEST@example.com');
      [createArgs] = client.create.lastCall.args;
    });

    test('sets the email to lower case', async () => {
      expect(createArgs.user_name).to.equal('test@example.com');
    });

    test('sets the password to a uuid', async () => {
      expect(createArgs.password).to.match(uuidRE);
    });

    test('sets the reset_guid to a uuid', async () => {
      expect(createArgs.reset_guid).to.match(uuidRE);
    });

    test('sets the user data to an empty object', async () => {
      expect(createArgs.user_data).to.equal({});
    });

    test('sets the user up to require a password reset', async () => {
      expect(createArgs.reset_required).to.equal(1);
    });

    test('sets the application', async () => {
      expect(createArgs.application).to.equal('test-application');
    });

    test('sets the external role', async () => {
      expect(createArgs.role.scopes).to.equal(['external']);
    });
  });
});
