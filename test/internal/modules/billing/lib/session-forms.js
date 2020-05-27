'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const sessionForms = require('internal/modules/billing/lib/session-forms');

const sandbox = require('sinon').createSandbox();

const formA = {
  action: '/form/a',
  method: 'post'
};

const formB = {
  action: '/form/b',
  method: 'post'
};

const createRequest = (overrides = {}) => ({
  yar: {
    get: sandbox.stub(),
    clear: sandbox.stub()
  },
  ...overrides
});

experiment('modules/billing/lib/session-forms', () => {
  let request, result;

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.get', () => {
    experiment('when no form key is specified in the query params', () => {
      beforeEach(async () => {
        request = createRequest();
      });

      test('does not clear the session cache', async () => {
        expect(request.yar.clear.called).to.be.false();
      });

      test('returns the default form', async () => {
        const result = sessionForms.get(request, formA);
        expect(result).to.equal(formA);
      });
    });

    experiment('when a form key is specified in the query params', () => {
      beforeEach(async () => {
        request = createRequest({
          query: {
            form: 'test-form-key'
          }
        });
      });

      experiment('and the form is found in the cache', async () => {
        beforeEach(async () => {
          request.yar.get.returns(formB);
          result = sessionForms.get(request, formA);
        });

        test('clears the session cache', async () => {
          expect(request.yar.clear.calledWith('test-form-key')).to.be.true();
        });

        test('returns the form from the session cache', async () => {
          expect(result).to.equal(formB);
        });
      });

      experiment('and the form is not found in the cache', async () => {
        beforeEach(async () => {
          request.yar.get.returns(undefined);
          result = sessionForms.get(request, formA);
        });

        test('does not clear the session cache', async () => {
          expect(request.yar.clear.called).to.be.false();
        });

        test('returns the default form', async () => {
          expect(result).to.equal(formA);
        });
      });
    });
  });
});
