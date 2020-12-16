'use strict';

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
  let request, data;
  beforeEach(() => {
    request = createRequest();
    data = {
      csrf_token: uuid(),
      faoRequired: true
    };
  });
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = addFaoFormSchema(request).validate(data);
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = addFaoFormSchema(createRequest()).validate({
        ...data,
        csrf_token: 'not-a-guid'
      });
      expect(result.error).to.exist();
    });
  });

  experiment('faoRequired', () => {
    test('validates for true', async () => {
      const result = addFaoFormSchema(request).validate(data);
      expect(result.error).to.be.null();
    });

    test('validates for false', async () => {
      const result = addFaoFormSchema(request).validate({
        ...data,
        faoRequired: false
      });
      expect(result.error).to.be.null();
    });

    test('fails for a value that is not a boolean', async () => {
      const result = addFaoFormSchema(request).validate({
        ...data,
        faoRequired: 'no'
      });
      expect(result.error).to.exist();
    });

    test('fails if blank', async () => {
      delete data.faoRequired;
      const result = addFaoFormSchema(request).validate(data);
      expect(result.error).to.exist();
    });
  });
});
