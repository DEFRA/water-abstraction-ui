'use strict';

const Lab = require('@hapi/lab');
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const config = require('external/config');

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

  // test the nunjucks/update-password/enter-new template
  experiment('getConfirmPassword in testMode', () => {
    beforeEach(async () => {
      request.view = { foo: 'bar' };
      sandbox.stub(config, 'testMode').value(true);
      sandbox.stub(config, 'isLocal').value(false);
      await controller.getConfirmPassword(request, h);
    });
    afterEach(async () => {
      sandbox.restore();
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/enter-new');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });

    test('the isTestMode is setup to return to true', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.isTestMode).to.equal(true);
    });
  });
  experiment('getConfirmPassword without testMode', () => {
    beforeEach(async () => {
      request.view = { foo: 'bar' };
      sandbox.stub(config, 'testMode').value(false);
      sandbox.stub(config, 'isLocal').value(false);
      await controller.getConfirmPassword(request, h);
    });
    afterEach(async () => {
      sandbox.restore();
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/update-password/enter-new');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });

    test('the isTestMode is setup to return to false', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.isTestMode).to.equal(false);
    });
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
      expect(template).to.equal('nunjucks/update-password/enter-new');
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
      expect(template).to.equal('nunjucks/update-password/success');
    });

    test('uses the view data from request.view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.foo).to.equal('bar');
    });
  });
});
