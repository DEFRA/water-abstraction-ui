'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const sessionHelpers = require('shared/lib/session-helpers');

const newAddress = require('internal/lib/new-address');

const address = {
  addressLine2: '123',
  addressLine3: 'Test Street',
  town: 'Testington',
  postcode: 'TT1 1TT',
  country: 'United Kingdom'
};

experiment('internal/lib/new-address', () => {
  let request;
  beforeEach(() => {
    sandbox.stub(sessionHelpers, 'saveToSession');

    request = {
      yar: {
        get: sandbox.stub().returns(address),
        clear: sandbox.stub()
      }
    };
  });

  afterEach(() => sandbox.restore());

  experiment('.get', () => {
    let response;
    beforeEach(() => {
      response = newAddress.get(request);
    });

    test('returns the address stored in the session', () => {
      expect(response).to.equal(address);
    });

    test('clears the session', () => {
      expect(request.yar.clear.called).to.be.true();
    });
  });

  experiment('.set', () => {
    beforeEach(() => {
      newAddress.set(request, address);
    });

    test('sets address data in the session', () => {
      expect(sessionHelpers.saveToSession.called).to.be.true();
    });
  });
});
