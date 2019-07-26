'use strict';

const Lab = require('@hapi/lab');
const { beforeEach, afterEach, experiment, test } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
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
    beforeEach(async () => {
      response = await updatePasswordConfig.authenticate('foo', 'bar');
    });

    test('calls IDM method with application as first argument', async () => {
      expect(connectors.idm.users.authenticate.calledWith('test_app', 'foo', 'bar')).to.be.true();
    });

    test('resolves with the IDM resetPassword response', async () => {
      expect(response).to.equal(AUTHENTICATE);
    });
  });

  experiment('updatePassword method', () => {
    let response;
    beforeEach(async () => {
      response = await updatePasswordConfig.updatePassword('foo', 'bar');
    });

    test('calls IDM method with application as first argument', async () => {
      expect(connectors.idm.users.updatePassword.calledWith('test_app', 'foo', 'bar')).to.be.true();
    });

    test('resolves with the IDM updatePassword response', async () => {
      expect(response).to.equal(UPDATE_RESPONSE);
    });
  });
});
