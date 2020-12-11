'use strict';

const { omit } = require('lodash');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const selectCompanyAddress = require('internal/modules/address-entry/forms/select-company-address');
const { findField, findButton } = require('../../../../lib/form-test');

const ADDRESS_ID = uuid();

const createRoles = () => ([
  {
    address: {
      id: ADDRESS_ID,
      addressLine1: '98 The new road',
      addressLine2: 'At the top',
      addressLine3: 'Down below',
      addressLine4: 'Middleshire',
      town: 'Newton Blah',
      postcode: 'NB1 2AA'
    }
  }
]);

const createRequest = () => ({
  view: {
    csrfToken: uuid()
  },
  pre: {
    addresses: createRoles()
  }
});

experiment('internal/modules/address-entry/select-company-address form', () => {
  let request;

  beforeEach(async => {
    request = createRequest();
  });
  test('sets the form method to POST', async () => {
    const form = selectCompanyAddress.form(request);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectCompanyAddress.form(request);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal(request.view.csrfToken);
  });
  test('has a selectedAddress field', async () => {
    const form = selectCompanyAddress.form(request);
    const selectedAddress = findField(form, 'selectedAddress');
    expect(selectedAddress).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectCompanyAddress.form(request);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('invoice-accounts/forms/select-address schema', () => {
  let request, data;

  beforeEach(async => {
    request = createRequest();
    data = {
      csrf_token: uuid(),
      selectedAddress: ADDRESS_ID
    };
  });

  test('validates when the data is valid', async () => {
    const { error } = selectCompanyAddress.schema(request).validate(data);
    expect(error).to.be.null();
  });

  experiment('.csrf_token validation', () => {
    test('fails if omitted', async () => {
      const { error } = selectCompanyAddress.schema(request).validate(omit(data, 'csrf_token'));
      expect(error).to.not.be.null();
    });

    test('fails if not a valid guid', async () => {
      const { error } = selectCompanyAddress.schema(request).validate({
        ...data,
        csrf_token: 'not-a-guid'
      });
      expect(error).to.not.be.null();
    });
  });

  experiment('.selectedAddress validation', () => {
    test('fails if omitted', async () => {
      const { error } = selectCompanyAddress.schema(request).validate(omit(data, 'selectedAddress'));
      expect(error).to.not.be.null();
    });

    test('fails if not a uuid', async () => {
      const { error } = selectCompanyAddress.schema(request).validate({
        ...data,
        selectedAddress: 'not-a-guid'
      });
      expect(error).to.not.be.null();
    });

    test('fails if uuid is not an addressId defined in request.pre', async () => {
      const { error } = selectCompanyAddress.schema(request).validate({
        ...data,
        selectedAddress: uuid()
      });
      expect(error).to.not.be.null();
    });
  });
});
