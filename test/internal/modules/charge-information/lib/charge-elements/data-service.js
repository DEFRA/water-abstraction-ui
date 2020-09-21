'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const { saveCustomCharge, sessionManager } = require('../../../../../../src/internal/modules/charge-information/lib/charge-elements/data-service');
const sessionHelpers = require('../../../../../../src/shared/lib/session-helpers');

experiment('internal/modules/charge-information/lib/charge-elements/data-service', () => {
  experiment('saveCustomCharge', () => {
    afterEach(async () => {
      sandbox.restore();
    });

    let request;

    beforeEach(async () => {
      request = {
        pre: {
          draftChargeInformation: { abstractionData: false }
        },
        server: { methods: { setDraftChargeInformation: sandbox.stub() } },
        yar: { clear: sandbox.stub() }
      };
    });

    const licenceId = 'test-licence-id';
    const sessionData = { test: 'data' };

    test('adds the charge element to the draft charge information', () => {
      saveCustomCharge(request, licenceId, sessionData);
      const args = request.server.methods.setDraftChargeInformation.lastCall.args;
      expect(args[0]).to.equal('test-licence-id');
      expect(args[1].abstractionData[0]).to.equal({ test: 'data' });
    });

    test('clears the charge element session data', () => {
      saveCustomCharge(request, licenceId, sessionData);
      const args = request.yar.clear.lastCall.args;
      expect(args[0]).to.equal(`chargeElement.${licenceId}`);
    });
  });

  experiment('sessionManager', () => {
    afterEach(async () => {
      sandbox.restore();
    });

    let request;

    beforeEach(async () => {
      sandbox.stub(sessionHelpers, 'saveToSession').resolves();

      request = {
        yar: { clear: sandbox.stub() }
      };
    });

    const licenceId = 'test-licence-id';
    const sessionData = { test: 'data' };

    test('adds the data to the charge element session object', () => {
      sessionManager(request, licenceId, sessionData);
      const args = sessionHelpers.saveToSession.lastCall.args;
      expect(args[0]).to.equal(request);
      expect(args[1]).to.equal(`chargeElement.${licenceId}`);
      expect(args[2]).to.equal({ test: 'data' });
    });
  });
});
