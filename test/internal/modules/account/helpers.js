const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const helpers = require('internal/modules/account/helpers');
const services = require('internal/lib/connectors/services');

const createConfig = (isLocal, testMode, idm) => {
  return {
    isLocal,
    testMode,
    idm
  };
};

experiment('account/helpers', async () => {
  beforeEach(() => {
    sandbox.stub(services.idm.users, 'findOne');
    sandbox.stub(services.idm.users, 'findOneByEmail');
    sandbox.stub(services.water.users, 'postCreateInternalUser');
  });
  afterEach(async () => sandbox.restore());

  experiment('getEmailRegex', () => {
    test('returns regex for email ending in .gov.uk if not local or in test mode', () => {
      const regex = helpers.getEmailRegex(createConfig());
      expect(regex).to.equal(/\.gov\.uk$/);
    });

    test('returns regex for email ending in .gov.uk or gmail.com if isLocal', () => {
      const regex = helpers.getEmailRegex(createConfig(true));
      expect(regex).to.equal(/(\.gov\.uk|gmail\.com)$/);
    });

    test('returns regex for email ending in .gov.uk if not local or in test mode', () => {
      const regex = helpers.getEmailRegex(createConfig(false, true));
      expect(regex).to.equal(/(\.gov\.uk|gmail\.com)$/);
    });
  });

  experiment('getUserById', async () => {
    test('calls findOne with correct arguments', async () => {
      services.idm.users.findOne.resolves({ data: {} });
      await helpers.getUserById(123);
      const [userId] = services.idm.users.findOne.lastCall.args;
      expect(userId).to.equal(123);
    });

    test('throws error if an error is returned', async () => {
      services.idm.users.findOne.resolves({ error: {} });
      const func = async () => helpers.getUserById(123);
      await expect(func()).to.reject();
    });
  });

  experiment('getUserByEmail', async () => {
    const testConfig = createConfig('', '', { application: 'test-app' });

    test('calls findOneByEmail with correct arguments', async () => {
      services.idm.users.findOneByEmail.resolves({ data: {} });
      await helpers.getUserByEmail('test@defra.gov.uk', testConfig);
      const [email, config] = services.idm.users.findOneByEmail.lastCall.args;
      expect(email).to.equal('test@defra.gov.uk');
      expect(config).to.equal('test-app');
    });

    test('if data returned, return user data', async () => {
      services.idm.users.findOneByEmail.resolves({ data: { user: { test: 'data' } } });
      const userData = await helpers.getUserByEmail('test@defra.gov.uk', testConfig);
      expect(userData).to.equal({ user: { test: 'data' } });
    });

    test('throws error if an error is returned', async () => {
      services.idm.users.findOneByEmail.resolves({ error: {} });
      const func = async () => helpers.getUserByEmail('test@defra.gov.uk', testConfig);
      await expect(func()).to.reject();
    });

    test('if nothing returned, return nothing', async () => {
      services.idm.users.findOneByEmail.resolves();
      const userData = await helpers.getUserByEmail('test@defra.gov.uk', testConfig);
      expect(userData).to.be.undefined();
    });
  });

  experiment('getInternalUser', async () => {
    test('calls postCreateInternalUser with correct arguments', async () => {
      services.water.users.postCreateInternalUser.resolves({ data: {} });
      await helpers.getInternalUser(789, 'test@defra.gov.uk', 'test-permission');
      const [callingUserId, newUserEmail, permission] = services.water.users.postCreateInternalUser.lastCall.args;
      expect(callingUserId).to.equal(789);
      expect(newUserEmail).to.equal('test@defra.gov.uk');
      expect(permission).to.equal('test-permission');
    });

    test('returns the result of the query', async () => {
      services.water.users.postCreateInternalUser.resolves({ data: { some: 'data' } });
      const returnValue = await helpers.getInternalUser('789', 'test@defra.gov.uk', 'test-permission');
      expect(returnValue).to.equal({ data: { some: 'data' } });
    });
  });
});
