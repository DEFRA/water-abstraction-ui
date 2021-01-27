'use strict';

const { expect } = require('@hapi/code');
const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const useRegisteredAddress = require('internal/modules/address-entry/forms/use-registered-address');
const { findField, findButton } = require('../../../../lib/form-test');
const sandbox = require('sinon').createSandbox();

const csrfToken = 'c5afe238-fb77-4131-be80-384aaf245842';
const address = {
  addressLine1: 'Test House',
  addressLine2: '123',
  addressLine3: 'Test Place',
  addressLine4: 'Test Place',
  town: 'Testington',
  county: 'Testingshire',
  postcode: 'TT1 1TT',
  country: 'United Kingdom'
};

const KEY = uuid();

const createRequest = (query = {}) => ({
  view: {
    csrfToken
  },
  query,
  params: { key: KEY },
  yar: {
    get: sandbox.stub().returns({})
  },
  pre: {
    company: {
      address: {}
    }
  }
});

experiment('internal/modules/address-entry/forms/use-registered-address', () => {
  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const form = useRegisteredAddress.form(createRequest());
      expect(form.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const form = useRegisteredAddress.form(createRequest());
      const csrf = findField(form, 'csrf_token');
      expect(csrf.value).to.equal(csrfToken);
    });

    test('has a useRegisteredAddress radio field', async () => {
      const form = useRegisteredAddress.form(createRequest());
      const field = findField(form, 'useRegisteredAddress');
      expect(field.options.widget).to.equal('radio');
      expect(field.options.choices[0].label).to.equal('Yes');
      expect(field.options.choices[1].label).to.equal('No');
      expect(field.value).to.be.null();
    });

    test('has a submit button', async () => {
      const form = useRegisteredAddress.form(createRequest());
      const button = findButton(form);
      expect(button.options.label).to.equal('Continue');
    });

    experiment('when the registered address is selected', async () => {
      let form;

      beforeEach(async () => {
        const request = createRequest();
        request.yar.get.returns({
          data: address
        });
        request.pre.company.address = address;
        form = useRegisteredAddress.form(request);
      });

      test('sets the useRegisteredAddress value to true', async () => {
        const field = findField(form, 'useRegisteredAddress');
        expect(field.value).to.be.true();
      });
    });

    experiment('when a different address is selected', async () => {
      let form;

      beforeEach(async () => {
        const request = createRequest();
        request.yar.get.returns({
          data: {
            ...address,
            addressLine1: 'Some other house'
          }
        });
        request.pre.company.address = address;
        form = useRegisteredAddress.form(request);
      });

      test('sets the useRegisteredAddress value to false', async () => {
        const field = findField(form, 'useRegisteredAddress');
        expect(field.value).to.be.false();
      });
    });
  });
});
