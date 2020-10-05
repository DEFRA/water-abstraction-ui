'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const { form, schema } = require('internal/modules/charge-information/forms/reason');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = changeReason => ({
  view: {
    csrfToken: 'token'
  },
  query: {},
  pre: {
    licence: {
      id: 'test-licence-id'
    },
    draftChargeInformation: {
      changeReason
    },
    changeReasons: [{
      changeReasonId: 'change-reason-1',
      description: 'Change Reason 1'
    },
    {
      changeReasonId: 'change-reason-2',
      description: 'Change Reason 2'
    },
    {
      changeReasonId: 'change-reason-3',
      description: 'Change Reason 3'
    }]
  }
});

experiment('internal/modules/charge-information/forms/reason', () => {
  experiment('.form', () => {
    let reasonForm;
    beforeEach(() => {
      reasonForm = form(createRequest());
    });

    test('sets the form method to POST', async () => {
      expect(reasonForm.method).to.equal('POST');
    });

    test('has CSRF token field', async () => {
      const csrf = findField(reasonForm, 'csrf_token');
      expect(csrf.value).to.equal('token');
    });

    test('has a submit button', async () => {
      const button = findButton(reasonForm);
      expect(button.options.label).to.equal('Continue');
    });

    test('has a choice for change reasons', async () => {
      const radio = findField(reasonForm, 'reason');

      expect(radio.options.choices[0].label).to.equal('Change Reason 1');
      expect(radio.options.choices[0].value).to.equal('change-reason-1');
      expect(radio.options.choices[1].label).to.equal('Change Reason 2');
      expect(radio.options.choices[1].value).to.equal('change-reason-2');
      expect(radio.options.choices[2].label).to.equal('Change Reason 3');
      expect(radio.options.choices[2].value).to.equal('change-reason-3');
    });

    test('sets the value of the changeReason, if provided', async () => {
      reasonForm = form(createRequest({ changeReasonId: 'change-reason-2' }));
      const changeReasonField = findField(reasonForm, 'reason');
      expect(changeReasonField.value).to.equal('change-reason-2');
    });
  });

  experiment('.schema', () => {
    let request, reasonSchema;
    beforeEach(() => {
      request = createRequest();
      reasonSchema = schema(request);
    });
    experiment('csrf token', () => {
      test('validates for a uuid', async () => {
        const result = reasonSchema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
        expect(result.error).to.be.null();
      });

      test('fails for a string that is not a uuid', async () => {
        const result = reasonSchema.csrf_token.validate('pizza');
        expect(result.error).to.exist();
      });
    });

    experiment('reason', () => {
      test('can be one of the change reason ids', async () => {
        const result = reasonSchema.reason.validate(request.pre.changeReasons[0].changeReasonId);
        expect(result.error).to.not.exist();
      });

      test('can be "non-chargeable"', async () => {
        const result = reasonSchema.reason.validate('non-chargeable');
        expect(result.error).to.not.exist();
      });

      test('cannot be a unexpected string', async () => {
        const result = reasonSchema.reason.validate('pizza');
        expect(result.error).to.exist();
      });
    });
  });
});
