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
          authenticate: sandbox.stub().resolves(),
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
      expect(template).to.equal('water/update-password/update_password');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });
  });

  experiment('postConfirmPassword', () => {
    experiment('when formError does not exist', () => {
      beforeEach(async () => {
        request = {
          payload: {
            password: 'test-password'
          },
          defra: {
            userName: 'test-userName'
          }
        };
        await controller.postConfirmPassword(request, h);
      });

      test('the resetPassword plugin option method is called', async () => {
        expect(h.realm.pluginOptions.authenticate.calledWith(request.defra.userName, request.payload.password)).to.be.true();
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
        }
      };
      await controller.postConfirmPassword(request, h);
    });

    test('the correct template is displayed', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('water/update-password/update_password');
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
      expect(template).to.equal('water/update-password/updated_password');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });
  });
});
