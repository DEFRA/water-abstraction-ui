const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const controller = require('external/modules/account/controller');
const services = require('external/lib/connectors/services');

experiment('modules/account/controller', () => {
  afterEach(async () => {
    sandbox.restore();
  });

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
      expect(template).to.equal('nunjucks/account/entry');
    });

    test('the userName is added to the view context', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.userName).to.equal('test-user');
    });
  });

  experiment('.getChangeEmail', () => {
    let request, h;
    beforeEach(async () => {
      h = { redirect: sandbox.spy() };
      request = {
        defra: { userName: 'test-user' }
      };
      sandbox.stub(services.water.changeEmailAddress, 'getStatus');
    });

    test('redirects to locked page if email change record is locked', async () => {
      services.water.changeEmailAddress.getStatus.resolves({
        data: {
          isLocked: true
        }
      });
      await controller.getChangeEmail(request, h);
      expect(h.redirect.calledWith(
        '/account/change-email/locked'
      )).to.equal(true);
    });

    test('redirects to security code page if unlocked record found', async () => {
      services.water.changeEmailAddress.getStatus.resolves({
        data: {
          isLocked: false
        }
      });
      await controller.getChangeEmail(request, h);
      expect(h.redirect.calledWith(
        '/account/change-email/verify-new-email'
      )).to.equal(true);
    });

    test('redirects to enter new email if no email change record found', async () => {
      services.water.changeEmailAddress.getStatus.throws({
        statusCode: 404
      });
      await controller.getChangeEmail(request, h);
      expect(h.redirect.calledWith(
        '/account/change-email/enter-new-email'
      )).to.equal(true);
    });

    test('throws non-404 API errors', async () => {
      services.water.changeEmailAddress.getStatus.throws({
        statusCode: 500
      });
      const func = () => controller.getChangeEmail(request, h);
      expect(func()).to.reject();
    });
  });

  experiment('.getChangeEmailLocked', () => {
    let request, h;

    beforeEach(async () => {
      request = {
        defra: {
          userName: 'bob@example.com'
        }
      };
      h = {
        view: sandbox.spy()
      };
      await controller.getChangeEmailLocked(request, h);
    });

    test('renders the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/try-again-later');
    });

    test('sets the correct back link in the view', async () => {
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.equal('/account');
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

  experiment('.postEnterNewEmail', () => {
    let h;

    beforeEach(async () => {
      h = {
        view: sandbox.spy(),
        redirect: sandbox.spy()
      };

      sandbox.stub(services.water.changeEmailAddress, 'postGenerateSecurityCode');
    });

    experiment('when the data is valid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            email: 'user@example.com',
            'confirm-email': 'user@example.com'
          },
          defra: {
            userId: 'user-1'
          }
        };

        await controller.postEnterNewEmail(request, h);
      });

      test('the user is redirected to the next step', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/verify-new-email');
      });
    });

    experiment('when the water API returns a locked status', async () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            email: 'user@example.com',
            'confirm-email': 'user@example.com'
          },
          defra: {
            userId: 'user-1'
          }
        };
        services.water.changeEmailAddress.postGenerateSecurityCode.rejects({
          statusCode: 423
        });
        await controller.postEnterNewEmail(request, h);
      });

      test('the user is redirected to the locked page', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/locked');
      });
    });

    experiment('when the water API throws an error', async () => {
      let request;
      beforeEach(async () => {
        request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            email: 'user@example.com',
            'confirm-email': 'user@example.com'
          },
          defra: {
            userId: 'user-1'
          }
        };
        services.water.changeEmailAddress.postGenerateSecurityCode.rejects();
      });

      test('the error is thrown', async () => {
        const func = () => controller.postEnterNewEmail(request, h);
        expect(func()).to.reject();
      });
    });

    experiment('when the data is invalid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            email: '',
            'confirm-password': ''
          },
          defra: {
            userId: 'user-1'
          }
        };

        await controller.postEnterNewEmail(request, h);
      });

      test('the expected view template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form-without-nav');
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
      h = {
        view: sandbox.spy(),
        redirect: sandbox.spy()
      };

      const request = {
        view: {
          csrfToken: 'token'
        },
        defra: {
          userId: 'user-1'
        }
      };

      sandbox.stub(services.water.changeEmailAddress, 'getStatus').resolves({
        data: {
          email: 'test@example.com'
        }
      });

      await controller.getVerifyEmail(request, h);
    });

    test('the expected view template is used', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/account/verify');
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

      sandbox.stub(services.water.changeEmailAddress, 'postSecurityCode');
      sandbox.stub(services.water.changeEmailAddress, 'getStatus').resolves({
        data: {
          email: 'test@example.com'
        }
      });
    });

    experiment('when the data is valid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: '7c83d7ec-4c09-47cb-b570-f0b00a8c11e9',
            'verificationCode': '123456'
          },
          defra: {
            userId: 'user-1'
          }
        };

        await controller.postVerifyEmail(request, h);
      });

      test('the user is redirected to the next step', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/success');
      });
    });

    experiment('when the water API responds with a locked status code', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: '7c83d7ec-4c09-47cb-b570-f0b00a8c11e9',
            'verificationCode': '123456'
          },
          defra: {
            userId: 'user-1'
          }
        };
        services.water.changeEmailAddress.postSecurityCode.rejects({
          statusCode: 423
        });
        await controller.postVerifyEmail(request, h);
      });

      test('the user is redirected to the locked page', async () => {
        const [url] = h.redirect.lastCall.args;
        expect(url).to.equal('/account/change-email/locked');
      });
    });

    experiment('when the user enters an incorrect code', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: '7c83d7ec-4c09-47cb-b570-f0b00a8c11e9',
            'verificationCode': '123456'
          },
          defra: {
            userId: 'user-1'
          }
        };
        services.water.changeEmailAddress.postSecurityCode.rejects({
          statusCode: 401
        });
        await controller.postVerifyEmail(request, h);
      });

      test('the form is re-rendered in an error state', async () => {
        const [template, view] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/account/verify');
        expect(view.form.errors.length).to.equal(1);
      });
    });

    experiment('when the API throws an unexpected error', () => {
      let request;
      beforeEach(async () => {
        request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: '7c83d7ec-4c09-47cb-b570-f0b00a8c11e9',
            'verificationCode': '123456'
          },
          defra: {
            userId: 'user-1'
          }
        };
        services.water.changeEmailAddress.postSecurityCode.rejects({
          statusCode: 500
        });
      });

      test('the error is thrown', async () => {
        const func = () => controller.postVerifyEmail(request, h);
        expect(func()).to.reject();
      });
    });

    experiment('when the data is invalid', () => {
      beforeEach(async () => {
        const request = {
          view: { csrfToken: 'token' },
          payload: {
            csrf_token: 'token',
            'verification-code': ''
          },
          defra: {
            userId: 'user-1'
          }
        };

        await controller.postVerifyEmail(request, h);
      });

      test('the expected view template is used', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/account/verify');
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
      expect(template).to.equal('nunjucks/account/success');
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
      expect(template).to.equal('nunjucks/account/try-again-later');
    });

    test('the view context is passed through', async () => {
      const [, context] = h.view.lastCall.args;
      expect(context.pageTitle).to.equal('test');
    });
  });
});
