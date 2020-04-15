'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { selectBillingTypeForm, billingTypeFormSchema } = require('internal/modules/billing/forms/billing-type');
const { findField, findButton } = require('../../../../lib/form-test');

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  }
});

const { ANNUAL, SUPPLEMENTARY, TWO_PART_TARIFF } = require('internal/modules/billing/lib/bill-run-types');

experiment('billing/forms/billing-type form', () => {
  test('sets the form method to POST', async () => {
    const form = selectBillingTypeForm(createRequest());
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const form = selectBillingTypeForm(createRequest());
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a billing type field', async () => {
    const form = selectBillingTypeForm(createRequest());
    const billingType = findField(form, 'selectedBillingType');
    expect(billingType).to.exist();
  });

  test('has a submit button', async () => {
    const form = selectBillingTypeForm(createRequest());
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('billing/forms/billing-type schema', () => {
  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = billingTypeFormSchema(createRequest()).csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = billingTypeFormSchema(createRequest()).csrf_token.validate('pizza');
      expect(result.error).to.exist();
    });
  });

  experiment('billing type', () => {
    test('It should only allow valid billing types in the water service', async () => {
      const result = Joi.describe(billingTypeFormSchema(createRequest()));
      expect(result.children.selectedBillingType.valids).to.equal([ANNUAL, SUPPLEMENTARY, TWO_PART_TARIFF]);
    });

    test('fails if blank', async () => {
      const result = billingTypeFormSchema(createRequest()).selectedBillingType.validate();
      expect(result.error).to.exist();
    });
  });

  experiment('twoPartTariffSeason', () => {
    test('is not required for an annual bill run', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingType: ANNUAL
      };

      const result = Joi.validate(data, billingTypeFormSchema());
      expect(result.error).not.to.exist();
    });

    test('is valid if a season is selected', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingType: TWO_PART_TARIFF,
        twoPartTariffSeason: 'summer'
      };

      const result = Joi.validate(data, billingTypeFormSchema());
      expect(result.error).not.to.exist();
    });

    test('fails if no season is selected', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingType: TWO_PART_TARIFF
      };

      const result = Joi.validate(data, billingTypeFormSchema());
      expect(result.error).to.exist();
    });

    test('fails if season is unexpected value', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingType: TWO_PART_TARIFF,
        twoPartTariffSeason: 'spring'
      };

      const result = Joi.validate(data, billingTypeFormSchema());
      expect(result.error).to.exist();
    });
  });
});
