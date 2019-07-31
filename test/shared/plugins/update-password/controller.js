'use strict';

const Lab = require('lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const Joi = require('joi');

const controller = require('shared/plugins/update-password/controller');

experiment('update password controller', () => {
  let h;
  let request;

  beforeEach(async () => {
    h = {
      redirect: sandbox.spy(),
      view: sandbox.spy(),
      realm: {
        pluginOptions: {
          authenticate: sandbox.stub().resolves({ test: true }),
          updatePassword: sandbox.stub().resolves({
            error: null
          })
        }
      }
    };

    request = {
      query: {
        resetGuid: 'test-guid'
      },
      payload: {
        userId: 'test-userId'
      },
      yar: {
        set: sandbox.stub().resolves()
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getConfirmPassword', () => {
    beforeEach(async () => {
      request.view = { foo: 'bar' };
      await controller.getConfirmPassword(request, h);
    });

    test('uses the template specified in the config', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/enter-current.njk');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });
  });

  experiment('postConfirmPassword', () => {
    experiment('when formError does not exist', () => {
      beforeEach(async () => {
        request.payload.password = 'test-password';
        request.defra = {
          userName: 'test-userName'
        };
        await controller.postConfirmPassword(request, h);
      });

      test('an auth token in added to session', async () => {
        const [key, value] = request.yar.set.lastCall.args;
        expect(key).to.equal('authToken');
        expect(Joi.string().uuid().validate(value).error).to.be.null();
      });

      test('the user is redirected to a page to enter a new password', async () => {
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/update-password/enter-new.njk');
        expect(Joi.string().uuid().validate(view.authToken).error).to.be.null();
      });
    });
  });

  experiment('when formError exists', () => {
    beforeEach(async () => {
      request = {
        payload: {
          password: 'test-password'
        },
        defra: {
          userName: 'test-userName'
        },
        formError: {
          name: 'test-error'
        },
        view: {}
      };
      await controller.postConfirmPassword(request, h);
    });

    test('the correct template is displayed', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/enter-current.njk');
    });

    test('an error object is passed in the options', async () => {
      const [, options] = h.view.lastCall.args;
      expect(options.error).to.be.an.object();
      expect(options.error.name).to.equal('test-error');
    });
  });

  experiment('getPasswordUpdated', () => {
    beforeEach(async () => {
      request.view = { foo: 'bar' };
      await controller.getPasswordUpdated(request, h);
    });

    test('uses the correcttemplate', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/success.njk');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });
  });
});
