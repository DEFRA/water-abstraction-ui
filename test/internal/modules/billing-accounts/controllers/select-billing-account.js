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
const { get } = require('lodash');

const controller = require('internal/modules/billing-accounts/controllers/select-billing-account');
const session = require('internal/modules/billing-accounts/lib/session');
const constants = require('internal/modules/billing-accounts/lib/constants');
const formTest = require('../../../../lib/form-test');
const services = require('internal/lib/connectors/services');
const { logger } = require('internal/logger');

const KEY = 'test-key';
const CSRF_TOKEN = uuid();
const REDIRECT_PATH = '/redirect/path';
const BACK_PATH = '/back';
const CAPTION = 'Licence 01/234';
const ACCOUNT_ENTRY_PATH = '/account-entry-redirect-path';
const ADDRESS_ENTRY_PATH = '/address-entry-redirect-path';
const CONTACT_ENTRY_PATH = '/contact-entry-redirect-path';
const COMPANY_ID = uuid();
const INVOICE_ACCOUNT_ID = uuid();
const ADDRESS = {
  addressLine1: 'Big Farm',
  addressLine2: 'Buttercup meadow',
  addressLine3: 'Daisy Ridge',
  addressLine4: 'Poppy woods',
  town: 'Testerton',
  postcode: 'TT1 1TT',
  county: 'Testingshire',
  country: 'United Kingdom'
};
const REGION_ID = uuid();
const START_DATE = '2020-01-01';

const data = {
  billingAccounts: [{
    id: uuid(),
    accountNumber: 'A1234B',
    company: {
      id: COMPANY_ID,
      name: 'Test Co Ltd'
    },
    invoiceAccountAddresses: [{
      dateRange: {
        startDate: '2020-01-01',
        endDate: null
      },
      address: ADDRESS
    }]
  }],
  account: {
    id: COMPANY_ID,
    name: 'Test Co Ltd'
  },
  sessionData: {
    caption: CAPTION,
    back: BACK_PATH,
    redirectPath: REDIRECT_PATH,
    regionId: REGION_ID,
    startDate: START_DATE,
    companyId: COMPANY_ID,
    data: {
      company: {
        id: COMPANY_ID
      },
      agentCompany: null,
      address: ADDRESS,
      contact: null
    }
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
      ...data.sessionData,
      isUpdate: overrides.isUpdate || false
    },
    billingAccounts: overrides.billingAccounts || data.billingAccounts,
    account: data.account
  },
  accountEntryRedirect: sandbox.stub().returns(ACCOUNT_ENTRY_PATH),
  addressLookupRedirect: sandbox.stub().returns(ADDRESS_ENTRY_PATH),
  contactEntryRedirect: sandbox.stub().returns(CONTACT_ENTRY_PATH),
  getAccountEntry: sandbox.stub(),
  getNewAddress: sandbox.stub(),
  getNewContact: sandbox.stub()
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
    sandbox.stub(session, 'get').returns(data.sessionData);
    sandbox.stub(session, 'setProperty');
    sandbox.stub(services.water.companies, 'postInvoiceAccount');
    sandbox.stub(services.water.invoiceAccounts, 'createInvoiceAccountAddress');
    sandbox.stub(logger, 'error');
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

  experiment('.getSelectAccount', () => {
    experiment('for the "new billing account" flow', () => {
      beforeEach(async () => {
        request = createRequest();
        await controller.getSelectAccount(request, h);
      });

      test('the page uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('the back link is defined', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/billing-account-entry/${KEY}`);
      });

      test('the page has the correct title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Who should the bills go to?');
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

      test('the form has radio options for licence holder or agent account', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'account');

        expect(field.options.widget).to.equal('radio');
        expect(field.options.choices.length).to.equal(2);

        expect(field.options.choices[0].label).to.equal('Test Co Ltd');
        expect(field.options.choices[0].value).to.equal(constants.BILLING_ACCOUNT_HOLDER);

        expect(field.options.choices[1].label).to.equal('Another billing contact');
        expect(field.options.choices[1].value).to.equal(constants.OTHER_ACCOUNT);
      });

      test('the "other billing" account option has a sub-field for the account name', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'account');
        const subField = get(field, 'options.choices[1].fields[0]');
        expect(subField.name).to.equal('accountSearch');
      });

      test('the form has a continue button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const button = formTest.findButton(form);
        expect(button.options.label).to.equal('Continue');
      });
    });

    experiment('for the "update address" flow', () => {
      beforeEach(async () => {
        request = createRequest({ isUpdate: true });
        await controller.getSelectAccount(request, h);
      });

      test('the back link exits the flow', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(request.pre.sessionData.back);
      });
    });
  });

  experiment('.postSelectAccount', () => {
    experiment('when the form has validation errors', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postSelectAccount(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the billing account holder is selected', () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            account: constants.BILLING_ACCOUNT_HOLDER
          }
        });
        session.get.returns({
          ...data.sessionData,
          data: {
            company: {
              id: COMPANY_ID
            }
          }
        });
        await controller.postSelectAccount(request, h);
      });

      test('the agent company is set to null in the session', async () => {
        expect(session.setProperty.calledWith(
          request, KEY, 'data.agentCompany', null
        )).to.be.true();
      });

      test('the address plugin method is called with the correct arguments', async () => {
        const [options] = request.addressLookupRedirect.lastCall.args;
        expect(options).to.equal({
          caption: CAPTION,
          key: KEY,
          back: `/billing-account-entry/${KEY}/select-account`,
          redirectPath: `/billing-account-entry/${KEY}/address-entry`,
          companyId: COMPANY_ID,
          companyNumber: undefined
        });
      });

      test('the user is redirected to the address plugin flow', async () => {
        expect(h.redirect.calledWith(ADDRESS_ENTRY_PATH)).to.be.true();
      });
    });

    experiment('when an agent account is selected', () => {
      const SEARCH_QUERY = 'Test query';

      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            account: constants.OTHER_ACCOUNT,
            accountSearch: SEARCH_QUERY
          }
        });
        session.get.returns({
          ...data.sessionData,
          data: {
            company: {
              id: COMPANY_ID
            }
          }
        });
        await controller.postSelectAccount(request, h);
      });

      test('the account entry plugin method is called with the correct arguments', async () => {
        const [options] = request.accountEntryRedirect.lastCall.args;
        expect(options).to.equal({
          back: `/billing-account-entry/${KEY}/select-account`,
          redirectPath: `/billing-account-entry/${KEY}/account-entry`,
          caption: CAPTION,
          searchQuery: SEARCH_QUERY,
          key: KEY
        });
      });

      test('the user is redirected to the account entry flow', async () => {
        expect(h.redirect.calledWith(ACCOUNT_ENTRY_PATH)).to.be.true();
      });
    });
  });

  experiment('.getHandleAgentAccountEntry', () => {
    const ACCOUNT = {
      id: uuid()
    };

    beforeEach(async () => {
      request = createRequest();
      request.getAccountEntry.returns(ACCOUNT);
      await controller.getHandleAgentAccountEntry(request, h);
    });

    test('request.getAccountEntry is called with the session key', async () => {
      expect(request.getAccountEntry.calledWith(KEY)).to.be.true();
    });

    test('the agent account is set in the session', async () => {
      expect(session.setProperty.calledWith(
        request, KEY, 'data.agentCompany', ACCOUNT
      )).to.be.true();
    });

    test('the user is redirected to the address entry', async () => {
      expect(h.redirect.calledWith(ADDRESS_ENTRY_PATH)).to.be.true();
    });
  });

  experiment('.getHandleAgentAddressEntry', () => {
    const ADDRESS = {
      addressLine1: 'Buttercup Farm'
    };

    experiment('when the check answers query param is not supplied', () => {
      beforeEach(async () => {
        request = createRequest();
        request.getNewAddress.returns(ADDRESS);
        await controller.getHandleAddressEntry(request, h);
      });

      test('request.getNewAddress is called with the session key', async () => {
        expect(request.getNewAddress.calledWith(KEY)).to.be.true();
      });

      test('the address is set in the session', async () => {
        expect(session.setProperty.calledWith(
          request, KEY, 'data.address', ADDRESS
        )).to.be.true();
      });

      test('the user is redirected to the "FAO required" page', async () => {
        expect(h.redirect.calledWith(
          `/billing-account-entry/${KEY}/fao`
        )).to.be.true();
      });
    });

    experiment('when the check answers query param is supplied', () => {
      beforeEach(async () => {
        request = createRequest({
          query: {
            checkAnswers: true
          }
        });
        request.getNewAddress.returns(ADDRESS);
        await controller.getHandleAddressEntry(request, h);
      });

      test('the user is redirected to the "check answers" page', async () => {
        expect(h.redirect.calledWith(
          `/billing-account-entry/${KEY}/check-answers`
        )).to.be.true();
      });
    });
  });

  experiment('.getSelectFaoRequired', () => {
    beforeEach(async () => {
      request = createRequest();
      await controller.getSelectFaoRequired(request, h);
    });

    test('the page uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/form');
    });

    test('the page has the correct title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Do you need to add an FAO?');
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

    test('the form has radio options for licence holder or agent account', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = formTest.findField(form, 'faoRequired');

      expect(field.options.widget).to.equal('radio');
      expect(field.options.choices.length).to.equal(2);

      expect(field.options.choices[0].value).to.equal(true);
      expect(field.options.choices[0].label).to.equal('Yes');

      expect(field.options.choices[1].value).to.equal(false);
      expect(field.options.choices[1].label).to.equal('No');
    });

    test('the form has a continue button', async () => {
      const [, { form }] = h.view.lastCall.args;
      const button = formTest.findButton(form);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.postSelectFaoRequired', () => {
    experiment('when the form has validation errors', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postSelectFaoRequired(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when an fao is required', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            faoRequired: 'true'
          }
        });
        await controller.postSelectFaoRequired(request, h);
      });

      test('request.contactEntryRedirect is called to get a redirect path', async () => {
        expect(request.contactEntryRedirect.calledWith({
          caption: CAPTION,
          key: KEY,
          back: `/billing-account-entry/${KEY}/fao`,
          redirectPath: `/billing-account-entry/${KEY}/contact-entry`,
          companyId: COMPANY_ID
        })).to.be.true();
      });

      test('the user is redirected to the contact entry flow', async () => {
        expect(h.redirect.calledWith(CONTACT_ENTRY_PATH)).to.be.true();
      });
    });

    experiment('when an fao is not required', async () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN,
            faoRequired: 'false'
          }
        });
        await controller.postSelectFaoRequired(request, h);
      });

      test('request.contactEntryRedirect is not called', async () => {
        expect(request.contactEntryRedirect.called).to.be.false();
      });

      test('the contact property is set to null in the session', async () => {
        expect(session.setProperty.calledWith(
          request, KEY, 'data.contact', null
        )).to.be.true();
      });

      test('the user is redirected to the "check answers" page', async () => {
        expect(h.redirect.calledWith(
          `/billing-account-entry/${KEY}/check-answers`
        )).to.be.true();
      });
    });
  });

  experiment('.getHandleContactEntry', () => {
    const CONTACT = {
      id: uuid()
    };

    beforeEach(async () => {
      request = createRequest();
      request.getNewContact.returns(CONTACT);
      await controller.getHandleContactEntry(request, h);
    });

    test('request.getNewContact is called with the session key', async () => {
      expect(request.getNewContact.calledWith(KEY)).to.be.true();
    });

    test('the contact is set in the session', async () => {
      expect(session.setProperty.calledWith(
        request, KEY, 'data.contact', CONTACT
      )).to.be.true();
    });

    test('the user is redirected to the check answers page', async () => {
      expect(h.redirect.calledWith(
        `/billing-account-entry/${KEY}/check-answers`
      )).to.be.true();
    });
  });

  experiment('.getCheckAnswers', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getCheckAnswers(request, h);
    });

    test('the page uses the correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/billing-accounts/check-answers');
    });

    test('the page has the correct title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Check billing account details');
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

    test('the form has a confirm button', async () => {
      const [, { form }] = h.view.lastCall.args;
      const button = formTest.findButton(form);
      expect(button.options.label).to.equal('Confirm');
    });

    test('links to change the answers are output to the view', async () => {
      const [, { links }] = h.view.lastCall.args;
      expect(links.company).to.equal(`/billing-account-entry/${KEY}/select-account`);
      expect(links.address).to.equal(ADDRESS_ENTRY_PATH);
      expect(links.fao).to.equal(`/billing-account-entry/${KEY}/fao`);
    });
  });

  experiment('.postCheckAnswers', () => {
    experiment('when there are no errors', () => {
      beforeEach(async () => {
        services.water.companies.postInvoiceAccount.resolves({
          id: INVOICE_ACCOUNT_ID
        });
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postCheckAnswers(request, h);
      });

      test('creates the billing account', async () => {
        const [companyId, data] = services.water.companies.postInvoiceAccount.lastCall.args;

        expect(companyId).to.equal(COMPANY_ID);

        expect(data).to.equal({
          regionId: REGION_ID,
          startDate: START_DATE
        });
      });

      test('creates the billing account address', async () => {
        const [invoiceAccountId, data] = services.water.invoiceAccounts.createInvoiceAccountAddress.lastCall.args;
        expect(invoiceAccountId).to.equal(INVOICE_ACCOUNT_ID);
        expect(data).to.equal({
          agentCompany: null,
          contact: null,
          address: ADDRESS
        });
      });

      test('redirects to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
      });
    });

    experiment('for the "update address" flow', () => {
      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          },
          isUpdate: true
        });
        await controller.postCheckAnswers(request, h);
      });

      test('only the "create address" service endpoint is called', async () => {
        expect(services.water.companies.postInvoiceAccount.called).to.be.false();
        expect(services.water.invoiceAccounts.createInvoiceAccountAddress.called).to.be.true();
      });
    });

    experiment('when there is an error', () => {
      const ERROR = new Error('oops');

      beforeEach(async () => {
        request = createPostRequest({
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        services.water.companies.postInvoiceAccount.rejects(ERROR);
      });

      test('the error is logged and rethrown', async () => {
        const func = () => controller.postCheckAnswers(request, h);
        await expect(func()).to.reject();
        expect(logger.error.calledWith(
          `Error saving billing account`, ERROR
        )).to.be.true();
      });
    });
  });
});
