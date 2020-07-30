'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { selectAddressForm, selectAddressFormSchema } = require('internal/modules/invoice-accounts/forms/select-address');
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

const createAddress = () => (
  [
    { id: uuid(),
      addressLine1: '98 The new road',
      addressLine2: 'At the top',
      addressLine3: 'Down below',
      addressLine4: 'Middleshire',
      town: 'Newton Blah',
      postcode: 'NB1 2AA'
    }]
);

experiment('invoice-accounts/forms/select-address form', () => {
  let request, address;

  beforeEach(async => {
    request = createRequest();
    address = createAddress();
  });
  test('sets the form method to POST', async () => {
    const form = selectAddressForm(request, address);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectAddressForm(request, address);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });
  test('has a selectedAddress field', async () => {
    const form = selectAddressForm(request, address);
    const selectedAddress = findField(form, 'selectedAddress');
    expect(selectedAddress).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectAddressForm(request, address);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/select-address schema', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = selectAddressFormSchema(request).csrf_token.validate(uuid());
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = selectAddressFormSchema(request).csrf_token.validate('happyness');
      expect(result.error).to.exist();
    });
  });
  experiment('selected address', () => {
    test('It should only allow uuid or new_address', async () => {
      const result = Joi.describe(selectAddressFormSchema(request));
      expect(result.children.selectedAddress.valids).to.equal(['new_address', Joi.string().uuid()]);
    });

    test('fails if blank', async () => {
      const result = selectAddressFormSchema(request).selectedAddress.validate();
      expect(result.error).to.exist();
    });
  });
});
