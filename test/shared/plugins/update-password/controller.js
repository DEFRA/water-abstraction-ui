'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

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

  // check the route exist to enter the new password
  experiment('postConfirmPassword', () => {
    experiment('when formError does not exist', () => {
      beforeEach(async () => {
        request.payload.password = 'test-password1';
        request.defra = {
          userName: 'test-userName'
        };
        await controller.postSetPassword(request, h);
      });

      test('the user is redirected to a success page', async () => {
        console.log(h.redirect.lastCall.lastArg);
        const template = h.redirect.lastCall.lastArg;
        expect(template).to.equal('/account/update-password/success');
      });
    });
  });

  // test the errors on the enter new password form
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
      await controller.postSetPassword(request, h);
    });

    test('the correct template is displayed', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/enter-new.njk');
    });
  });

  // test the success page template
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
