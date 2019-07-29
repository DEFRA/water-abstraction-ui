const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('external/modules/account/controller');

experiment('modules/account/controller', () => {
  experiment('.getAccount', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };

      const request = {
        defra: { userName: 'test-user' }
      };

      await controller.getAccount(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/entry.njk');
    });

    test('the userName is added to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.userName).to.equal('test-user');
    });
  });

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
      expect(template).to.equal('nunjucks/form.njk');
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
    });

    experiment('when the data is valid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            password: 'secrets'
          }
        };

        await controller.postConfirmPassword(request, h);
      });

      test('the user is redirected to the next step', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/enter-new-email');
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
        expect(template).to.equal('nunjucks/form.njk');
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

  experiment('.getEnterNewEmail', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };

      const request = {
        view: { csrfToken: 'token' }
      };

      await controller.getEnterNewEmail(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
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

  experiment('.postEnterNewEmail', () => {
    let h;

    beforeEach(async () => {
      h = {
        view: sandbox.spy(),
        redirect: sandbox.spy()
      };
    });

    experiment('when the data is valid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            email: 'user@example.com',
            'confirm-email': 'user@example.com'
          }
        };

        await controller.postEnterNewEmail(request, h);
      });

      test('the user is redirected to the next step', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/verify-new-email');
      });
    });

    experiment('when the data is invalid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            email: '',
            'confirm-password': ''
          }
        };

        await controller.postEnterNewEmail(request, h);
      });

      test('the expected view template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form.njk');
      });

      test('the view contains a form with errors', async () => {
        const [, context] = h.view.lastCall.args;
        expect(context.form.errors).to.not.be.empty();
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

  experiment('.getVerifyEmail', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };

      const request = {
        view: {
          newEmail: 'test@example.com',
          csrfToken: 'token'
        }
      };

      await controller.getVerifyEmail(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/verify.njk');
    });

    test('the view data is passed through to the view', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.newEmail).to.equal('test@example.com');
    });

    test('the back link is setup to return to /account', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.back).to.equal('/account');
    });
  });

  experiment('.postVerifyEmail', () => {
    let h;

    beforeEach(async () => {
      h = {
        view: sandbox.spy(),
        redirect: sandbox.spy()
      };
    });

    experiment('when the data is valid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            'verification-code': '12345'
          }
        };

        await controller.postVerifyEmail(request, h);
      });

      test('the user is redirected to the next step', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/success');
      });
    });

    experiment('when the data is invalid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            'verification-code': ''
          }
        };

        await controller.postVerifyEmail(request, h);
      });

      test('the expected view template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/account/verify.njk');
      });

      test('the view contains a form with errors', async () => {
        const [, context] = h.view.lastCall.args;
        expect(context.form.errors).to.not.be.empty();
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

  experiment('.getSuccess', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };

      const request = {
        view: {
          pageTitle: 'test'
        }
      };

      await controller.getSuccess(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/success.njk');
    });

    test('the view context is passed through', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.pageTitle).to.equal('test');
    });
  });

  experiment('.getTryAgainLater', () => {
    let h;

    beforeEach(async () => {
      h = { view: sandbox.spy() };

      const request = {
        view: {
          pageTitle: 'test'
        }
      };

      await controller.getTryAgainLater(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/try-again-later.njk');
    });

    test('the view context is passed through', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.pageTitle).to.equal('test');
    });
  });
});
