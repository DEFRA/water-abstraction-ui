'use strict';

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/use-abstraction-data');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    draftChargeInformation: {},
    chargeVersions: []
  }
});

experiment('internal/modules/charge-information/forms/use-abstraction-data', () => {
  experiment('.form', () => {
    test('sets the form method to POST', async () => {
      const abstractionForm = form(createRequest());
      expect(abstractionForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const abstractionForm = form(createRequest());
      const csrf = findField(abstractionForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const abstractionForm = form(createRequest());
      const button = findButton(abstractionForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has yes and no choices for using abstraction data and does not include the divider', async () => {
      const abstractionForm = form(createRequest());
      const radio = findField(abstractionForm, 'useAbstractionData');

      expect(radio.options.choices[0].label).to.equal('Yes');
      expect(radio.options.choices[1].label).to.equal('No');
      expect(radio.options.choices.length).to.equal(2);
    });

    test('has yes and no choices as well as options for existing charge versions for using abstraction data', async () => {
      const request = createRequest();
      request.pre.chargeVersions = [
        { id: 'test-cv-id-1', status: 'superseded', dateRange: { startDate: '2001-03-19' } },
        { id: 'test-cv-id-2', status: 'current', dateRange: { startDate: '2015-06-19' } },
        { id: 'test-cv-id-2', status: 'invalid', dateRange: { startDate: '2015-06-19' } }
      ];
      const abstractionForm = form(request);
      const radio = findField(abstractionForm, 'useAbstractionData');

      expect(radio.options.choices[0].label).to.equal('Yes');
      expect(radio.options.choices[1].label).to.equal('No');
      expect(radio.options.choices[2].divider).to.equal('or');
      expect(radio.options.choices[3].label).to.equal('Use charge information valid from 19 June 2015');
    });
  });

  experiment('.schema', () => {
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = schema(createRequest()).csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('useAbstractionData', () => {
      test('can be true', async () => {
        const result = schema(createRequest()).useAbstractionData.validate('yes');
        expect(result.error).to.not.exist();
      });

      test('can be true', async () => {
        const result = schema(createRequest()).useAbstractionData.validate('no');
        expect(result.error).to.not.exist();
      });

      test('can be a charge version id', async () => {
        const request = createRequest();
        request.pre.chargeVersions = [
          { id: 'test-cv-id-1', status: 'superseded', dateRange: { startDate: '2001-03-19' } },
          { id: 'test-cv-id-3', status: 'current', dateRange: { startDate: '2015-06-19' } },
          { id: 'test-cv-id-2', status: 'invalid', dateRange: { startDate: '2015-06-19' } }
        ];
        const result = schema(request).useAbstractionData.validate('test-cv-id-3');
        expect(result.error).to.not.exist();
      });

      test('cannot be a unexpected string be true', async () => {
        const result = schema(createRequest()).useAbstractionData.validate('pizza');
        expect(result.error).to.exist();
      });
    });
  });
});
