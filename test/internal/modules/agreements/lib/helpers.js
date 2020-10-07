'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const helpers = require('internal/modules/agreements/lib/helpers');
const Joi = require('@hapi/joi');

experiment('internal/modules/agreements/lib/reducer', () => {
  let request, h;

  beforeEach(async () => {
    request = {
      params: {
        licenceId: 'test-licence-id'
      },
      yar: {
        get: sandbox.stub(),
        set: sandbox.stub(),
        clear: sandbox.stub()
      },
      pre: {
        licence: {
          id: 'test-licence-id'
        }
      }
    };

    h = {
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };
  });

  experiment('.getAddAgreementSessionData', () => {
    test('sets flow state to the session with a generated key', async () => {
      helpers.getAddAgreementSessionData(request);
      expect(request.yar.get.calledWith(
        'licence.test-licence-id.create-agreement'
      )).to.be.true();
    });
  });

  experiment('.clearAddAgreementSessionData', () => {
    test('clears flow state to the session with a generated key', async () => {
      helpers.clearAddAgreementSessionData(request);
      expect(request.yar.clear.calledWith(
        'licence.test-licence-id.create-agreement'
      )).to.be.true();
    });
  });

  experiment('createAddAgreementPostHandler', () => {
    let formContainer, actionCreator;

    beforeEach(async () => {
      formContainer = {
        form: () => ({
          method: 'post',
          validationType: 'joi',
          fields: [{
            name: 'foo',
            options: {}
          }]
        }),
        schema: () => ({
          foo: Joi.string().valid('bar')
        })
      };

      actionCreator = sandbox.stub().returns({ type: 'test-action' });
    });

    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request.payload = {
          foo: 'bar'
        };
        await helpers.createAddAgreementPostHandler(request, h, formContainer, actionCreator, 'test/path');
      });

      test('the next state is set in the session', async () => {
        expect(request.yar.set.calledWith(
          'licence.test-licence-id.create-agreement', { foo: 'bar' }
        ));
      });

      test('the user is redirected', async () => {
        expect(h.redirect.calledWith('/licences/test-licence-id/agreements/test/path'));
      });
    });

    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        request.payload = {
          foo: 'not-bar'
        };
        await helpers.createAddAgreementPostHandler(request, h, formContainer, actionCreator, 'test/path');
      });

      test('the next state is not set in the session', async () => {
        expect(request.yar.set.called).to.be.false();
      });

      test('h.postRedirectGet is called with the form in error state', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form).to.be.an.object();
        expect(form.errors).to.be.an.array().length(1);
      });
    });
  });
});
