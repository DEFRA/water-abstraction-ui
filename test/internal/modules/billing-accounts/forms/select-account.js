'use strict';

const Joi = require('joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const selectAccountForm = require('internal/modules/billing-accounts/forms/select-account');
const { findField, findButton } = require('../../../../lib/form-test');
const { BILLING_ACCOUNT_HOLDER, OTHER_ACCOUNT } = require('internal/modules/billing-accounts/lib/constants');

const companyId = uuid();
const companyName = 'test company name';

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  },
  pre: {
    sessionData: {
      data: {
        agentCompany: null
      }
    },
    account: {
      id: companyId,
      name: companyName
    }
  }
});

const createCompany = () => ({
  company: { value: uuid(), label: 'The water company', hint: 'person' }
});

experiment('internal/billing-accounts/forms/select-account', () => {
  let request;
  let company;
  let companies = [];

  beforeEach(async => {
    request = createRequest();
    company = createCompany();
    companies = [company];
  });
  test('sets the form method to POST', async () => {
    const form = selectAccountForm.form(request, companies, {});
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectAccountForm.form(request, companies, {});
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has an "account" field', async () => {
    const form = selectAccountForm.form(request, companies, {});
    const selectCompany = findField(form, 'account');
    expect(selectCompany).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectAccountForm.form(request, companies, {});
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/select-company schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = selectAccountForm.schema(createRequest()).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = selectAccountForm.schema(createRequest()).csrf_token.validate('noodles');
      expect(result.error).to.exist();
    });
  });

  experiment('selected account', () => {
    test('It allows billing account holder', async () => {
      const result = selectAccountForm.schema(createRequest()).account.validate(BILLING_ACCOUNT_HOLDER);
      expect(result.error).to.be.null();
    });

    test('It allows other account holder', async () => {
      const result = selectAccountForm.schema(createRequest()).account.validate(OTHER_ACCOUNT);
      expect(result.error).to.be.null();
    });

    test('It fails for an invalid value', async () => {
      const result = selectAccountForm.schema(createRequest()).account.validate('noodles');
      expect(result.error).to.not.be.null();
    });

    test('fails if blank', async () => {
      const result = selectAccountForm.schema(createRequest()).account.validate();
      expect(result.error).to.exist();
    });
  });

  experiment('company search', () => {
    test('is not required if a company has been selected', async () => {
      const data = {
        csrf_token: uuid(),
        account: BILLING_ACCOUNT_HOLDER
      };

      const result = selectAccountForm.schema().validate(data);
      expect(result.error).to.be.null();
    });

    test('is valid if a company name is entered', async () => {
      const data = {
        csrf_token: uuid(),
        account: OTHER_ACCOUNT,
        accountSearch: 'some company name'
      };
      const result = selectAccountForm.schema().validate(data);
      expect(result.error).to.be.null();
    });

    test('fails if no company search name has been entered', async () => {
      const data = {
        csrf_token: uuid(),
        selectedCompany: 'company_search',
        companySearch: ''
      };
      const result = selectAccountForm.schema().validate(data);
      expect(result.error).to.exist();
    });
  });
});
