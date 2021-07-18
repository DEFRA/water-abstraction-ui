'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('../../../../../../src/internal/modules/charge-information/forms/charge-element/agreements');
const { findField, findButton } = require('../../../../../lib/form-test');

const licenceNumber = '01/234/ABC';
const elementId = 'test-element-id';

const createRequest = (chargeElements = []) => ({
  path: '/some/path',
  view: {
    csrfToken: 'token'
  },
  query: {},
  params: {
    licenceId: 'test-licence-id',
    elementId
  },
  pre: {
    draftChargeInformation: {
      chargeElements
    },
    licence: {
      licenceNumber
    }
  }
});

experiment('internal/modules/charge-information/forms/charge-element/agreements', () => {
  let agreementForm;

  experiment('.form', () => {
    experiment('when the value is not defined in the charge element', () => {
      beforeEach(async () => {
        agreementForm = form(createRequest());
      });

      test('sets the form method to POST', async () => {
        expect(agreementForm.method).to.equal('POST');
      });

      test('has CSRF token field', async () => {
        const csrf = findField(agreementForm, 'csrf_token');
        expect(csrf.value).to.equal('token');
      });

      test('has a submit button', async () => {
        const button = findButton(agreementForm);
        expect(button.options.label).to.equal('Continue');
      });

      test('has a isSection127AgreementEnabled field', async () => {
        const field = findField(agreementForm, 'isSection127AgreementEnabled');
        expect(field.options.caption).to.equal(`Licence ${licenceNumber}`);
        expect(field.options.label).to.equal('Should agreements apply to this element?');
        expect(field.options.hint).to.equal('Normally, an agreement will apply to all elements');
        expect(field.options.widget).to.equal('radio');
        expect(field.options.mapper).to.equal('booleanMapper');
        expect(field.value).to.be.undefined();
      });
    });

    experiment('when the value is defined in the charge element', () => {
      beforeEach(async () => {
        const request = createRequest([{
          id: elementId,
          isSection127AgreementEnabled: true
        }]);
        agreementForm = form(request);
      });

      test('the isSection127AgreementEnabled field is set to the value on the charge element', async () => {
        const field = findField(agreementForm, 'isSection127AgreementEnabled');
        expect(field.value).to.be.true();
      });
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.undefined();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('sciccors');
        expect(result.error).to.exist();
      });
    });

    experiment('isSection127AgreementEnabled', () => {
      test('validates for a boolean', async () => {
        const result = schema().isSection127AgreementEnabled.validate(true);
        expect(result.error).to.not.exist();
      });

      test('can not be null', async () => {
        const result = schema().isSection127AgreementEnabled.validate(null);
        expect(result.error).to.exist();
      });
    });
  });
});
