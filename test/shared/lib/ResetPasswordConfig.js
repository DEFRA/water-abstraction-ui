'use strict';

const Lab = require('lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const ResetPasswordConfig = require('shared/lib/ResetPasswordConfig');

const RESET_RESPONSE = 'resetPassword';
const GET_RESPONSE = 'getUserByResetGuid';
const UPDATE_RESPONSE = 'updatePasswordWithGuid';

experiment('ResetConfig class', () => {
  let connectors, config, resetPasswordConfig;

  beforeEach(async () => {
    connectors = {
      idm: {
        users: {
          resetPassword: sandbox.stub().resolves(RESET_RESPONSE),
          getUserByResetGuid: sandbox.stub().resolves(GET_RESPONSE),
          updatePasswordWithGuid: sandbox.stub().resolves(UPDATE_RESPONSE)
        }
      }
    };
    config = {
      idm: {
        application: 'test_app'
      }
    };

    resetPasswordConfig = new ResetPasswordConfig(config, connectors);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('resetPassword method', () => {
    let response;
    beforeEach(async () => {
      response = await resetPasswordConfig.resetPassword('foo', 'bar');
    });

    test('calls IDM method with application as first argument', async () => {
      expect(connectors.idm.users.resetPassword.calledWith('test_app', 'foo', 'bar')).to.be.true();
    });

    test('resolves with the IDM resetPassword response', async () => {
      expect(response).to.equal(RESET_RESPONSE);
    });
  });

  experiment('getUserByResetGuid method', () => {
    let response;
    beforeEach(async () => {
      response = await resetPasswordConfig.getUserByResetGuid('foo', 'bar');
    });

    test('calls IDM method with application as first argument', async () => {
      expect(connectors.idm.users.getUserByResetGuid.calledWith('test_app', 'foo', 'bar')).to.be.true();
    });

    test('resolves with the IDM getUserByResetGuid response', async () => {
      expect(response).to.equal(GET_RESPONSE);
    });
  });

  experiment('updatePasswordWithGuid method', () => {
    let response;
    beforeEach(async () => {
      response = await resetPasswordConfig.updatePasswordWithGuid('foo', 'bar');
    });

    test('calls IDM method with application as first argument', async () => {
      expect(connectors.idm.users.updatePasswordWithGuid.calledWith('test_app', 'foo', 'bar')).to.be.true();
    });

    test('resolves with the IDM updatePasswordWithGuid response', async () => {
      expect(response).to.equal(UPDATE_RESPONSE);
    });
  });
});
