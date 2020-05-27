'use strict';

const Joi = require('@hapi/joi');
const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { selectBillingRegionForm, billingRegionFormSchema } = require('internal/modules/billing/forms/billing-region');
const { findField, findButton } = require('../../../../lib/form-test');

const getBillingRegions = () => ({
  data: [
    {
      regionId: '07ae7f3a-2677-4102-b352-cc006828948c',
      chargeRegionId: 'A',
      naldRegionId: 1,
      name: 'Anglian',
      displayName: 'Anglian (Display)',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    },
    {
      regionId: 'd8a257d4-b5a9-4420-ad51-d4fbe07b0f1a',
      chargeRegionId: 'B',
      naldRegionId: 2,
      name: 'Midlands',
      displayName: 'Midlands (Display)',
      dateCreated: '2019-11-05T12:10:35.164Z',
      dateUpdated: '2019-11-05T12:10:35.164Z'
    }
  ]
});

const createRequest = () => ({
  view: {
    csrfToken: 'token'
  },
  params: {
    billingType: 'annual'
  }
});

experiment('billing/forms/billing-region form', () => {
  test('sets the form method to POST', async () => {
    const { data } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), data);
    expect(form.method).to.equal('POST');
  });

  test('has CSRF token field', async () => {
    const { data } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), data);
    const csrf = findField(form, 'csrf_token');
    expect(csrf.value).to.equal('token');
  });

  test('has a region selection field', async () => {
    const { data } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), data);
    const radio = findField(form, 'selectedBillingRegion');
    expect(radio).to.exist();
  });

  test('the regions are displayed using the display name', async () => {
    const { data: regions } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), regions);
    const radio = findField(form, 'selectedBillingRegion');

    expect(radio.options.choices[0].label).to.equal('Anglian (Display)');
    expect(radio.options.choices[1].label).to.equal('Midlands (Display)');
  });

  test('has a billing type field with a value', async () => {
    const { data } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), data);
    const field = findField(form, 'selectedBillingType');
    expect(field.value).to.equal('annual');
  });

  test('has a season field with a value', async () => {
    const { data } = getBillingRegions();
    const request = createRequest();
    request.params.season = 'summer';

    const form = selectBillingRegionForm(request, data);
    const field = findField(form, 'selectedTwoPartTariffSeason');
    expect(field.value).to.equal('summer');
  });

  test('has a submit button', async () => {
    const { data } = getBillingRegions();
    const form = selectBillingRegionForm(createRequest(), data);
    const button = findButton(form);
    expect(button.options.label).to.equal('Continue');
  });
});

experiment('billing/forms/billing-region schema', () => {
  let schema;

  beforeEach(async () => {
    schema = billingRegionFormSchema(getBillingRegions().data);
  });

  experiment('csrf token', () => {
    test('validates for a uuid', async () => {
      const result = schema.csrf_token.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.be.null();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = schema.csrf_token.validate('pizza');
      expect(result.error).to.exist();
    });
  });

  experiment('region Id', () => {
    test('validates for a valid region uuid', async () => {
      const result = schema.selectedBillingRegion.validate(getBillingRegions().data[0].regionId);
      expect(result.error).to.be.null();
    });

    test('fails for an invalid uuid', async () => {
      const result = schema.selectedBillingRegion.validate('c5afe238-fb77-4131-be80-384aaf245842');
      expect(result.error).to.exist();
    });

    test('fails for a string that is not a uuid', async () => {
      const result = schema.selectedBillingRegion.validate('pizza');
      expect(result.error).to.exist();
    });
    test('fails if blank', async () => {
      const result = schema.selectedBillingRegion.validate();
      expect(result.error).to.exist();
    });
  });
  experiment('billing type', () => {
    test('validates for a string', async () => {
      const result = schema.selectedBillingType.validate('annual');
      expect(result.error).to.be.null();
    });

    test('fails if blank', async () => {
      const result = schema.selectedBillingType.validate();
      expect(result.error).to.exist();
    });
  });

  experiment('selectedTwoPartTariffSeason', () => {
    test('is not required if the billing type is annual', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingRegion: getBillingRegions().data[0].regionId,
        selectedBillingType: 'annual',
        selectedTwoPartTariffSeason: ''
      };

      const result = Joi.validate(data, schema);
      expect(result.error).not.to.exist();
    });

    test('passes for two part tariff when supplied', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingRegion: getBillingRegions().data[0].regionId,
        selectedBillingType: 'two_part_tariff',
        selectedTwoPartTariffSeason: 'summer'
      };

      const result = Joi.validate(data, schema);
      expect(result.error).not.to.exist();
    });

    test('fails when missing for two part tariff', async () => {
      const data = {
        csrf_token: uuid(),
        selectedBillingRegion: getBillingRegions().data[0].regionId,
        selectedBillingType: 'two_part_tariff',
        selectedTwoPartTariffSeason: ''
      };

      const result = Joi.validate(data, schema);
      expect(result.error).to.exist();
    });
  });
});
