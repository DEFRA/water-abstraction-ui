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

const controller = require('internal/modules/account-entry/controller');
const session = require('internal/modules/account-entry/lib/session');
const formTest = require('../../../lib/form-test');
const { accountTypes, organisationTypes } = require('shared/lib/constants');

const KEY = 'test-key';
const CSRF_TOKEN = uuid();
const REDIRECT_PATH = '/redirect/path';
const BACK_PATH = '/back';
const CAPTION = 'Licence 01/234';

const data = {
  companies: [{
    id: uuid(),
    name: 'Company A'
  },
  {
    id: uuid(),
    name: 'Company B'
  }],
  companiesHouseResults: [{
    company: {
      organisationType: 'limitedCompany',
      name: 'Test Co LTD',
      companyNumber: '01234',
      companyAddresses: [],
      companyContacts: []
    }
  }]
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
    companies: overrides.companies || data.companies,
    companiesHouseResults: data.companiesHouseResults
  }
});

const createPostRequest = (overrides = {}) => createRequest({
  ...overrides,
  method: 'post'
});

experiment('src/internal/modules/account-entry/controller.js', () => {
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
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getSelectExistingAccount', () => {
    const PATH = `/account-entry/${KEY}/select-existing-account`;

    experiment('when there are 0 existing companies', () => {
      beforeEach(async () => {
        request = createRequest({ path: PATH, companies: [] });
        await controller.getSelectExistingAccount(request, h);
      });

      test('the user is redirected to the select account type page', async () => {
        expect(h.redirect.calledWith(
          `/account-entry/${KEY}/select-account-type`
        )).to.be.true();
      });
    });

    experiment('when there are 1+ companies', () => {
      beforeEach(async () => {
        request = createRequest({ path: PATH });
        await controller.getSelectExistingAccount(request, h);
      });

      test('the user is not redirected', async () => {
        expect(h.redirect.called).to.be.false();
      });

      test('the correct template is used', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('nunjucks/form');
      });

      test('the page has the correct title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Does this account already exist?');
      });

      test('the page has the correct caption', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(CAPTION);
      });

      test('the page has the correct back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(BACK_PATH);
      });

      test('the page defines a POST form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
        expect(form.method).to.equal('POST');
        expect(form.action).to.equal(PATH);
      });

      test('the form has a CSRF token field', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'csrf_token');
        expect(field.value).to.equal(CSRF_TOKEN);
      });

      test('the form has a radio field to select the existing accounts', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'companyId');
        expect(field.options.widget).to.equal('radio');
      });

      test('the radio field has choices for each company', async () => {
        const [, { form }] = h.view.lastCall.args;
        const { options: { choices } } = formTest.findField(form, 'companyId');
        expect(choices.length).to.equal(4);
        expect(choices[0].value).to.equal(request.pre.companies[0].id);
        expect(choices[0].label).to.equal(request.pre.companies[0].name);
        expect(choices[1].value).to.equal(request.pre.companies[1].id);
        expect(choices[1].label).to.equal(request.pre.companies[1].name);
        expect(choices[2]).to.equal({ divider: 'or' });
        expect(choices[3].value).to.equal('new_account');
        expect(choices[3].label).to.equal('Set up a new account');
      });

      test('the form has a continue button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const button = formTest.findButton(form);
        expect(button.options.label).to.equal('Continue');
      });
    });
  });

  experiment('.postSelectExistingAccount', () => {
    const PATH = `/account-entry/${KEY}/select-existing-account`;

    experiment('when the form has validation errors', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postSelectExistingAccount(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when an existing company is selected', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN,
            companyId: data.companies[0].id
          }
        });
        await controller.postSelectExistingAccount(request, h);
      });

      test('the postRedirectGet is not called', async () => {
        expect(h.postRedirectGet.called).to.be.false();
      });

      test('the company is stored in the session', async () => {
        expect(session.merge.calledWith(
          request, KEY, { data: data.companies[0] }
        )).to.be.true();
      });

      test('the user is redirected back to the parent flow', async () => {
        expect(h.redirect.calledWith(
          REDIRECT_PATH
        )).to.be.true();
      });
    });

    experiment('when a new company is selected', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN,
            companyId: 'new_account'
          }
        });
        await controller.postSelectExistingAccount(request, h);
      });

      test('the postRedirectGet is not called', async () => {
        expect(h.postRedirectGet.called).to.be.false();
      });

      test('the company is not stored in the session', async () => {
        expect(session.merge.called).to.be.false();
      });

      test('the user is redirected to the "select account type" page', async () => {
        expect(h.redirect.calledWith(
          `/account-entry/${KEY}/select-account-type`
        )).to.be.true();
      });
    });
  });

  experiment('.getSelectAccountType', () => {
    const PATH = `/account-entry/${KEY}/select-account-type`;

    beforeEach(async () => {
      request = createRequest({ path: PATH });
      await controller.getSelectAccountType(request, h);
    });

    test('the correct template is used', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('nunjucks/form');
    });

    test('the page has the correct title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Select the account type');
    });

    test('the page has the correct caption', async () => {
      const [, { caption }] = h.view.lastCall.args;
      expect(caption).to.equal(CAPTION);
    });

    test('the page has the correct back link', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`/account-entry/${KEY}/select-existing-account`);
    });

    test('the page defines a POST form', async () => {
      const [, { form }] = h.view.lastCall.args;
      expect(form).to.be.an.object();
      expect(form.method).to.equal('POST');
      expect(form.action).to.equal(PATH);
    });

    test('the form has a radio field to select the account type', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = formTest.findField(form, 'accountType');
      expect(field.options.widget).to.equal('radio');
    });

    test('the radio field has choices for individual/organisation', async () => {
      const [, { form }] = h.view.lastCall.args;
      const { options: { choices } } = formTest.findField(form, 'accountType');
      expect(choices.length).to.equal(3);

      expect(choices[0].value).to.equal(accountTypes.organisation);
      expect(choices[0].label).to.equal('Company');
      expect(choices[1]).to.equal({ divider: 'or' });
      expect(choices[2].value).to.equal(accountTypes.person);
      expect(choices[2].label).to.equal('Individual');
    });

    test('the "Individual" radio option has a disclosure field for the name', async () => {
      const [, { form }] = h.view.lastCall.args;
      const { options: { choices } } = formTest.findField(form, 'accountType');
      expect(choices.length).to.equal(3);
      expect(choices[2].fields).to.be.an.array().length(1);
      expect(choices[2].fields[0].name).to.equal('personName');
    });

    test('the form has a CSRF token field', async () => {
      const [, { form }] = h.view.lastCall.args;
      const field = formTest.findField(form, 'csrf_token');
      expect(field.value).to.equal(CSRF_TOKEN);
    });

    test('the form has a continue button', async () => {
      const [, { form }] = h.view.lastCall.args;
      const button = formTest.findButton(form);
      expect(button.options.label).to.equal('Continue');
    });
  });

  experiment('.postSelectAccountType', () => {
    const PATH = `/account-entry/${KEY}/select-account-type`;

    experiment('when the form has validation errors', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postSelectAccountType(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the organisation type is "organisation"', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN,
            accountType: accountTypes.organisation
          }
        });
        await controller.postSelectAccountType(request, h);
      });

      test('the user is redirected to the "search companies" page', async () => {
        expect(h.redirect.calledWith(
          `/account-entry/${KEY}/company-search`
        )).to.be.true();
      });
    });

    experiment('when the organisation type is "person"', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN,
            accountType: accountTypes.person,
            personName: 'Joe Bloggs'
          }
        });
        await controller.postSelectAccountType(request, h);
      });

      test('the account is stored to the session', async () => {
        expect(session.merge.calledWith(request, KEY, {
          data: {
            type: accountTypes.person,
            organisationType: organisationTypes.individual,
            name: request.payload.personName
          }
        })).to.be.true();
      });

      test('the user is redirected back to the parent flow', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH));
      });
    });
  });

  experiment('.getCompanySearch', () => {
    const PATH = `/account-entry/${KEY}/company-search`;

    experiment('when the form has not been submitted', () => {
      beforeEach(async () => {
        request = createRequest({
          path: PATH
        });
        await controller.getCompanySearch(request, h);
      });

      test('the page uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('the page has the correct title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Enter the company details');
      });

      test('the page has the correct caption', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(CAPTION);
      });

      test('the page has the correct back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(`/account-entry/${KEY}/select-account-type`);
      });

      test('the page defines a GET form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
        expect(form.method).to.equal('get');
        expect(form.action).to.equal(PATH);
      });

      test('the form has a search field', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'q');
        expect(field.options.label).to.equal('Enter the Companies House number or company name');
      });

      test('the form has a button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findButton(form);
        expect(field.options.label).to.equal('Find company');
      });
    });

    experiment('when the form is submitted with an empty search query', () => {
      beforeEach(async () => {
        request = createRequest({
          path: PATH,
          query: {
            q: ''
          }
        });
        await controller.getCompanySearch(request, h);
      });

      test('a validation message is displayed', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form.errors).to.be.an.array().length(1);
        expect(form.errors[0]).to.equal(
          {
            name: 'q',
            message: 'Enter the Companies House number or company name',
            summary: 'Enter the Companies House number or company name'
          }
        );
      });
    });

    experiment('when the get form is submitted with a valid search query', () => {
      beforeEach(async () => {
        request = createRequest({
          path: PATH,
          query: {
            q: 'Valid query'
          }
        });
        await controller.getCompanySearch(request, h);
      });

      test('the page uses the correct template', async () => {
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
      });

      test('the page has the correct title', async () => {
        const [, { pageTitle }] = h.view.lastCall.args;
        expect(pageTitle).to.equal('Select the registered company details');
      });

      test('the page has the correct caption', async () => {
        const [, { caption }] = h.view.lastCall.args;
        expect(caption).to.equal(CAPTION);
      });

      test('the page has the correct back link', async () => {
        const [, { back }] = h.view.lastCall.args;
        expect(back).to.equal(PATH);
      });

      test('the page defines a POST form', async () => {
        const [, { form }] = h.view.lastCall.args;
        expect(form).to.be.an.object();
        expect(form.method).to.equal('POST');
        expect(form.action).to.equal(`${PATH}?q=${encodeURIComponent('Valid query')}`);
      });

      test('the form has a CSRF token field', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'csrf_token');
        expect(field.value).to.equal(CSRF_TOKEN);
      });

      test('the form has a dropdown field to select the company', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findField(form, 'selectedCompaniesHouseNumber');
        expect(field.options.label).to.equal('Select a company');
        expect(field.options.widget).to.equal('dropdown');

        expect(field.options.choices).to.equal([
          { value: null, label: '1 companies found' },
          { value: '01234', label: 'Test Co LTD, 01234' }
        ]);
      });

      test('the form has a button', async () => {
        const [, { form }] = h.view.lastCall.args;
        const field = formTest.findButton(form);
        expect(field.options.label).to.equal('Continue');
      });
    });
  });

  experiment('.postCompanySearch', () => {
    const PATH = `/account-entry/${KEY}/company-search`;

    experiment('when a company is not selected from the dropdown', () => {
      beforeEach(async () => {
        const request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN
          }
        });
        await controller.postCompanySearch(request, h);
      });

      test('the user is redirected to the form with errors displayed', async () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when a company is selected from the dropdown', () => {
      beforeEach(async () => {
        request = createPostRequest({
          path: PATH,
          payload: {
            csrf_token: CSRF_TOKEN,
            selectedCompaniesHouseNumber: data.companiesHouseResults[0].company.companyNumber
          }
        });
        await controller.postCompanySearch(request, h);
      });

      test('the selected company is stored in the session', async () => {
        expect(session.merge.calledWith(
          request,
          KEY,
          {
            data: {
              organisationType: 'limitedCompany',
              name: 'Test Co LTD',
              companyNumber: '01234',
              type: 'organisation'
            }
          }
        )).to.be.true();
      });

      test('the user is redirected to the redirect path', async () => {
        expect(h.redirect.calledWith(REDIRECT_PATH)).to.be.true();
      });
    });
  });
});
