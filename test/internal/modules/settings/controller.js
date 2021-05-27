'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('internal/modules/settings/controller');

experiment('internal/modules/settings/controller', () => {
  let h, request;

  const csrfToken = uuid();

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };

    request = {
      method: 'get',
      path: '/setttings',
      view: {
        csrfToken
      },
      pre: {
        applicationState: {
          data: {
            isInvoiceAccountImportEnabled: true,
            isLicenceAgreementImportEnabled: true,
            isBillingDocumentRoleImportEnabled: true
          }
        }
      },
      yar: {
        get: sandbox.stub()
      },
      services: {
        water: {
          applicationState: {
            set: sandbox.stub()
          }
        }
      }
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getSettings', () => {
    beforeEach(async () => {
      await controller.getSettings(request, h);
    });

    test('uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form.njk');
    });

    test('sets the page title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Application settings');
    });

    test('defines a form', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
    });
  });

  experiment('.postSettings', () => {
    experiment('when validation fails', () => {
      beforeEach(async () => {
        const postRequest = {
          ...request,
          method: 'post',
          payload: {
            csrf_token: csrfToken,
            isInvoiceAccountImportEnabled: 'not-a-boolean',
            isLicenceAgreementImportEnabled: 'true',
            isBillingDocumentRoleImportEnabled: 'true'
          }
        };
        await controller.postSettings(postRequest, h);
      });

      test('the user is redirected to the form with errors', async () => {
        const [form] = h.postRedirectGet.lastCall.args;
        expect(form.errors).to.be.an.array().length(1);
      });
    });

    experiment('when validation succeeds', () => {
      beforeEach(async () => {
        const postRequest = {
          ...request,
          method: 'post',
          payload: {
            csrf_token: csrfToken,
            isInvoiceAccountImportEnabled: 'false',
            isLicenceAgreementImportEnabled: 'true',
            isBillingDocumentRoleImportEnabled: 'true'
          }
        };
        await controller.postSettings(postRequest, h);
      });

      test('the user is not redirected to the form with errors', async () => {
        expect(h.postRedirectGet.called).to.be.false();
      });

      test('the data is posted to the water service API', async () => {
        expect(request.services.water.applicationState.set.calledWith(
          'settings', {
            isInvoiceAccountImportEnabled: false,
            isLicenceAgreementImportEnabled: true,
            isBillingDocumentRoleImportEnabled: true
          }
        )).to.be.true();
      });
    });
  });
});
