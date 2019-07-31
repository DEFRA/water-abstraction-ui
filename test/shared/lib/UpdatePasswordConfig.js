'use strict';

const Lab = require('lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const UpdatePasswordConfig = require('shared/lib/UpdatePasswordConfig');

const AUTHENTICATE = 'authenticate';
const UPDATE_RESPONSE = 'updatePassword';

experiment('ResetConfig class', () => {
  let connectors, config, updatePasswordConfig;

  beforeEach(async () => {
    connectors = {
      idm: {
        users: {
          authenticate: sandbox.stub().resolves(AUTHENTICATE),
          updatePassword: sandbox.stub().resolves(UPDATE_RESPONSE)
        }
      }
    };
    config = {
      idm: {
        application: 'test_app'
      }
    };

    updatePasswordConfig = new UpdatePasswordConfig(config, connectors);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('authenticate method', () => {
    let response;
    let email;
    let password;

    beforeEach(async () => {
      email = 'test@example.com';
      password = 'secret-123';
      response = await updatePasswordConfig.authenticate(email, password);
    });

    test('calls IDM method with email as first argument', async () => {
      const [emailArg] = connectors.idm.users.authenticate.lastCall.args;
      expect(emailArg).to.equal(email);
    });

    test('calls IDM method with password as second argument', async () => {
      const [, passwordArg] = connectors.idm.users.authenticate.lastCall.args;
      expect(passwordArg).to.equal(password);
    });

    test('calls IDM method with application as third argument', async () => {
      const [, , applicationArg] = connectors.idm.users.authenticate.lastCall.args;
      expect(applicationArg).to.equal('test_app');
    });

    test('resolves with the IDM resetPassword response', async () => {
      expect(response).to.equal(AUTHENTICATE);
    });
  });

  experiment('updatePassword method', () => {
    let response;
    let userId;
    let password;

    beforeEach(async () => {
      userId = 123321;
      password = 'secret-123';

      response = await updatePasswordConfig.updatePassword(userId, password);
    });

    test('calls IDM method with application as first argument', async () => {
      const [applicationArg] = connectors.idm.users.updatePassword.lastCall.args;
      expect(applicationArg).to.equal('test_app');
    });

    test('calls IDM method with userId as second argument', async () => {
      const [, userIdArg] = connectors.idm.users.updatePassword.lastCall.args;
      expect(userIdArg).to.equal(userId);
    });

    test('calls IDM method with password as third argument', async () => {
      const [, , passwordArg] = connectors.idm.users.updatePassword.lastCall.args;
      expect(passwordArg).to.equal(password);
    });

    test('resolves with the IDM updatePassword response', async () => {
      expect(response).to.equal(UPDATE_RESPONSE);
    });
  });
});
