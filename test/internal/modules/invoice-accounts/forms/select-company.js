'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { selectCompanyForm, selectCompanyFormSchema } = require('internal/modules/invoice-accounts/forms/select-company');
const { findField, findButton } = require('../../../../lib/form-test');

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
    companies: [],
    company: {
      id: companyId,
      name: companyName
    }
  }
});

const createCompany = () => ({
  company: { value: uuid(), label: 'The water company', hint: 'person' }
});

experiment('invoice-accounts/forms/select-company form', () => {
  let request;
  let company;
  let companies = [];

  beforeEach(async => {
    request = createRequest();
    company = createCompany();
    companies = [company];
  });
  test('sets the form method to POST', async () => {
    const form = selectCompanyForm(request, companies, {});
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectCompanyForm(request, companies, {});
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has a selectedCompany type field', async () => {
    const form = selectCompanyForm(request, companies, {});
    const selectCompany = findField(form, 'selectedCompany');
    expect(selectCompany).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectCompanyForm(request, companies, {});
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/select-company schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = selectCompanyFormSchema(createRequest()).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = selectCompanyFormSchema(createRequest()).csrf_token.validate('noodles');
      expect(result.error).to.exist();
    });
  });

  experiment('selected Company', () => {
    test('It should only allow uuid or company_search', async () => {
      const result = Joi.describe(selectCompanyFormSchema(createRequest()));
      expect(result.children.selectedCompany.valids).to.equal(['company_search', Joi.string().uuid()]);
    });

    test('fails if blank', async () => {
      const result = selectCompanyFormSchema(createRequest()).selectedCompany.validate();
      expect(result.error).to.exist();
    });
  });

  experiment('company search', () => {
    test('is not required if a company has been selected', async () => {
      const data = {
        csrf_token: uuid(),
        selectedCompany: uuid()
      };

      const result = Joi.validate(data, selectCompanyFormSchema());
      expect(result.error).not.to.exist();
    });

    test('is valid if a company name is entered', async () => {
      const data = {
        csrf_token: uuid(),
        selectedCompany: 'company_search',
        companySearch: 'some company name'
      };
      const result = Joi.validate(data, selectCompanyFormSchema());
      expect(result.error).not.to.exist();
    });

    test('fails if no company search name has been entered', async () => {
      const data = {
        csrf_token: uuid(),
        selectedCompany: 'company_search',
        companySearch: ''
      };
      const result = Joi.validate(data, selectCompanyFormSchema());
      expect(result.error).to.exist();
    });
  });
});
