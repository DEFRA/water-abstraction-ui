'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { addFaoForm, addFaoFormSchema } = require('../../../../../src/internal/modules/invoice-accounts/forms/add-fao');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  params: {
    regionId: uuid(),
    companyId: uuid()
  }
});

experiment('invoice-accounts/forms/add-fao form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });

  test('sets the form method to POST', async () => {
    const form = addFaoForm(request);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = addFaoForm(request);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });

  test('has region id field', async () => {
    const form = addFaoForm(request);
    const regionId = findField(form, 'regionId');
    expect(regionId.value).to.equal(request.params.regionId);
  });

  test('has company id field', async () => {
    const form = addFaoForm(request);
    const companyId = findField(form, 'companyId');
    expect(companyId.value).to.equal(request.params.companyId);
  });

  test('has a FAO yes/no required field', async () => {
    const form = addFaoForm(request);
    const faoRequired = findField(form, 'faoRequired');
    expect(faoRequired).to.exist();
  });

  test('has a submit button', async () => {
    const form = addFaoForm(request);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/add-fao schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).csrf_token.validate('notAGuid');
      expect(result.error).to.exist();
    });
  });

  experiment('region Id', () => {
    test('validates for a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).regionId.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).regionId.validate('the-moon');
      expect(result.error).to.exist();
    });
  });

  experiment('company Id', () => {
    test('validates for a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).companyId.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).companyId.validate('the-moon-farm');
      expect(result.error).to.exist();
    });
  });

  experiment('faoRequired', () => {
    test('It should only allow yes or no', async () => {
      const result = Joi.describe(addFaoFormSchema(createRequest()));
      expect(result.children.faoRequired.valids).to.equal(['yes', 'no']);
    });

    test('fails if blank', async () => {
      const result = addFaoFormSchema(createRequest()).faoRequired.validate();
      expect(result.error).to.exist();
    });
  });
});
