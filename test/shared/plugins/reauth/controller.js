const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const controller = require('shared/plugins/reauth/controller');
const { set } = require('lodash');
const moment = require('moment');

experiment('.getConfirmPassword', () => {
  let h;

  beforeEach(async () => {
    h = { view: sandbox.spy() };

    const request = {
      view: { csrfToken: 'token' }
    };

    await controller.getConfirmPassword(request, h);
  });

  test('the expected view template is used', async () => {
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/form-without-nav');
  });

  test('the view data is passed through to the view', async () => {
    const [, context] = h.view.lastCall.args;
    expect(context.csrfToken).to.equal('token');
  });

  test('the back link is setup to return to /account', async () => {
    const [, context] = h.view.lastCall.args;
    expect(context.back).to.equal('/account');
  });
});

experiment('.postConfirmPassword', () => {
  let h;

  beforeEach(async () => {
    h = {
      view: sandbox.spy(),
      redirect: sandbox.spy()
    };
    set(h, 'realm.pluginOptions.reauthenticate', sandbox.stub());
  });

  experiment('when the data is valid', () => {
    let request;

    beforeEach(async () => {
      request = {
        view: { csrfToken: 'token' },
        payload: {
          csrf_token: '75fc8526-b206-460f-a615-7a6f493f723d',
          password: 'Secrets1234&'
        },
        yar: {
          get: sandbox.stub(),
          set: sandbox.stub()
        },
        defra: {
          userId: 'user_1'
        }
      };

      request.yar.get.returns('/account/change-email/enter-new-email');

      await controller.postConfirmPassword(request, h);
    });

    test('the user is redirected to the next step', async () => {
      const [url] = h.redirect.lastCall.args;
      expect(url).to.equal('/account/change-email/enter-new-email');
    });

    test('an expiry time is set in the session', async () => {
      const [key, time] = request.yar.set.lastCall.args;
      expect(key).to.equal('reauthExpiryTime');
      expect(moment(time).isValid()).to.equal(true);
    });
  });

  experiment('when the data is invalid', () => {
    beforeEach(async () => {
      const request = {
        view: { csrfToken: 'token' },
        payload: { password: '' }
      };

      await controller.postConfirmPassword(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form-without-nav');
    });

    test('the view data is passed through to the view', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.csrfToken).to.equal('token');
    });

    test('the back link is setup to return to /account', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.back).to.equal('/account');
    });
  });
});

experiment('.getPasswordLocked', () => {
  let h;

  beforeEach(async () => {
    h = { view: sandbox.spy() };

    const request = {
      view: { csrfToken: 'token' }
    };

    await controller.getPasswordLocked(request, h);
  });

  test('the expected view template is used', async () => {
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/reauth/try-again-later');
  });

  test('the view data is passed through to the view', async () => {
    const [, context] = h.view.lastCall.args;
    expect(context.csrfToken).to.equal('token');
  });

  test('the back link is setup to return to /account', async () => {
    const [, context] = h.view.lastCall.args;
    expect(context.back).to.equal('/account');
  });
});
