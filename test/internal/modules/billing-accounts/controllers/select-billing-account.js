'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const controller = require('internal/modules/billing-accounts/controllers/select-billing-account');
const session = require('internal/modules/billing-accounts/lib/session');
const constants = require('internal/modules/billing-accounts/lib/constants');
const formTest = require('../../../../lib/form-test');

const KEY = 'test-key';
const CSRF_TOKEN = uuid();
const REDIRECT_PATH = '/redirect/path';
const BACK_PATH = '/back';
const CAPTION = 'Licence 01/234';

const data = {
  billingAccounts: [{
    id: uuid(),
    accountNumber: 'A1234B',
    company: {
      name: 'Test Co Ltd'
    },
    invoiceAccountAddresses: [{
      dateRange: {
        startDate: '2020-01-01',
        endDate: null
      },
      address: {
        addressLine1: 'Big Farm',
        addressLine2: 'Buttercup meadow',
        addressLine3: 'Daisy Ridge',
        addressLine4: 'Poppy woods',
        town: 'Testerton',
        postcode: 'TT1 1TT',
        county: 'Testingshire',
        country: 'United Kingdom'
      }
    }]
  }],
  account: {
    name: 'Test Co Ltd'
  }
};

const createRequest = (overrides = {}) => ({
  path: overrides.path,
  method: overrides.method || 'get',
  view: {
    csrfToken: CSRF_TOKEN
  },
  params: {
    key: KEY
  },
  payload: overrides.payload || {},
  query: overrides.query || {},
  yar: {
    get: sandbox.stub().returns(),
    set: sandbox.stub(),
    clear: sandbox.stub()
  },
  pre: {
    sessionData: {
      caption: CAPTION,
      back: BACK_PATH,
      redirectPath: REDIRECT_PATH
    },
    billingAccounts: overrides.billingAccounts || data.billingAccounts,
    account: data.account
  }
});

const createPostRequest = (overrides = {}) => createRequest({
  ...overrides,
  method: 'post'
});

experiment('internal/modules/billing-accounts/controllers/select-billing-account', () => {
  let request, h;

  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub(),
      postRedirectGet: sandbox.stub()
    };

    sandbox.stub(session, 'merge').returns({
      redirectPath: REDIRECT_PATH
    });
    sandbox.stub(session, 'setProperty');
  });

  afterEach(async () => sandbox.restore());

  experiment('.getSelectExistingBillingAccount', () => {
    experiment('when there are 0 existing billing accounts', () => {
      beforeEach(async () => {
        request = createRequest({
          billingAccounts: []
        });
        await controller.getSelectExistingBillingAccount(request, h);
      });

      test('the user is redirected to the "select agent" screen', async () => {
        expect(h.redirect.calledWith(`/billing-account-entry/${KEY}/select-account`)).to.be.true();
      });
    });

    experiment('when there are 1+ existing billing accounts', () => {
      beforeEach(async () => {
        request = createRequest();
        await controller.getSelectExistingBillingAccount(request, h);
      });

      test('the page uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('the page has the correct title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Select an existing billing account for Test Co Ltd');
      });

      test('the page has the correct caption', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(CAPTION);
      });

      test('a form object is output to the view', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
      });

      test('the form has a CSRF token field', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'csrf_token');
        expect(field.value).to.equal(CSRF_TOKEN);
      });

      test('the form has radio options for each existing billing account', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'billingAccountId');

        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices.length).to.equal(3);
        expect(field.options.choices[0].html).to.equal('A1234B - Test Co Ltd<br>Big Farm, Buttercup meadow, Daisy Ridge, Poppy woods, Testerton, Testingshire, TT1 1TT, United Kingdom');
        expect(field.options.choices[0].value).to.equal(data.billingAccounts[0].id);
        expect(field.options.choices[1]).to.equal({
          divider: 'or'
        });
        expect(field.options.choices[2].label).to.equal('Set up a new billing account');
        expect(field.options.choices[2].value).to.equal(constants.NEW_BILLING_ACCOUNT);
      });

      test('the form has a continue button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const button = formTest.findButton(form);
        expect(button.options.label).to.equal('Continue');
      });
    });
  });

  experiment('.postSelectExistingBillingAccount', () => {
    experiment('when the form has validation errors', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postSelectExistingBillingAccount(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the "new billing account" option is selected', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            billingAccountId: constants.NEW_BILLING_ACCOUNT
          }
        });
        await controller.postSelectExistingBillingAccount(request, h);
      });

      test('the billing account .id property in the session is set to undefined', async () => {
        expect(session.setProperty.calledWith(
          request, KEY, 'data.id', undefined
        )).to.be.true();
      });

      test('the .company property in the session is set to request.pre.account', async () => {
        expect(session.setProperty.calledWith(
          request, KEY, 'data.company', request.pre.account
        )).to.be.true();
      });

      test('the user is redirected to the "select account" page', async () => {
        expect(h.redirect.calledWith(
          `/billing-account-entry/${KEY}/select-account`
        )).to.be.true();
      });
    });

    experiment('when an existing billing account is selected', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            billingAccountId: data.billingAccounts[0].id
          }
        });
        await controller.postSelectExistingBillingAccount(request, h);
      });

      test('the billing account is stored in the session', async () => {
        expect(session.merge.calledWith(
          request, KEY, { data: data.billingAccounts[0] }
        )).to.be.true();
      });

      test('the user is redirected to the parent flow', async () => {
        expect(h.redirect.calledWith(
          REDIRECT_PATH
        )).to.be.true();
      });
    });
  });
});
