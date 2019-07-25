const { expect } = require('code');
const uuid = require('uuid/v4');
const Joi = require('joi');
const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const {
  form: singleTotalAbstractionPeriodForm,
  schema: singleTotalAbstractionPeriodSchema
} = require('internal/modules/returns/forms/single-total-abstraction-period');

experiment('single-total-abstraction-period form', () => {
  let request;
  let data;

  beforeEach(async () => {
    data = {};
    request = {
      view: {
        csrfToken: 'test-csrf-token'
      },
      query: {
        returnId: 'test-return-id'
      }
    };
  });

  test('has a hidden csrf field', async () => {
    const form = singleTotalAbstractionPeriodForm(request, data);
    const csrf = form.fields.find(x => x.name === 'csrf_token');
    expect(csrf.value).to.equal('test-csrf-token');
  });

  test('has question field', async () => {
    const form = singleTotalAbstractionPeriodForm(request, data);
    const meterDetails = form.fields.find(x => x.name === 'totalCustomDates');
    expect(meterDetails.options.label).to.equal('What period was used for this volume?');
    expect(meterDetails.options.widget).to.equal('radio');
  });

  test('has a continue button', async () => {
    const form = singleTotalAbstractionPeriodForm(request, data);
    const button = form.fields.find(f => {
      return f.options.widget === 'button' && f.options.label === 'Continue';
    });
    expect(button).to.exist();
  });

  test('sets the data if provided', async () => {
    data.reading = {
      totalCustomDates: true,
      totalCustomDateStart: '2018-01-01',
      totalCustomDateEnd: '2019-01-01'
    };

    const form = singleTotalAbstractionPeriodForm(request, data);
    const question = form.fields.find(x => x.name === 'totalCustomDates');
    expect(question.value).to.be.true();
  });
});

experiment('schema', () => {
  const csrf = uuid();
  const returnData = {
    lines: [
      { startDate: '2017-01-01', endDate: '2018-01-01' },
      { startDate: '2018-01-01', endDate: '2019-01-01' }
    ]
  };

  experiment('when there is no custom period', () => {
    test('the data validates', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = { totalCustomDates: false, csrf_token: csrf };
      const { error, value } = Joi.validate(data, schema);

      expect(error).to.be.null();
      expect(value).to.equal({
        totalCustomDates: false,
        csrf_token: csrf
      });
    });

    test('validation fails for missing csrf token', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = { totalCustomDates: false };
      const { error } = Joi.validate(data, schema);

      expect(error).not.to.be.null();
    });

    test('validation fails for missing totalCustomDates value', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = { csrf_token: csrf };
      const { error } = Joi.validate(data, schema);

      expect(error).not.to.be.null();
    });
  });

  experiment('when there is a custom period', () => {
    test('the start date must be at least the start date of the first return line', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = {
        totalCustomDates: true,
        csrf_token: csrf,
        totalCustomDateEnd: '2018-06-01',
        totalCustomDateStart: '2000-01-01'
      };
      const { error } = Joi.validate(data, schema);
      expect(error.details[0].type).to.equal('date.min');
    });

    test('the end date must be at no greater than the end date of the last return line', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = {
        totalCustomDates: true,
        csrf_token: csrf,
        totalCustomDateEnd: '2020-01-01',
        totalCustomDateStart: '2018-06-01'
      };
      const { error } = Joi.validate(data, schema);
      expect(error.details[0].type).to.equal('date.max');
    });

    test('the end date must be greater than the start date', async () => {
      const schema = singleTotalAbstractionPeriodSchema({}, returnData);
      const data = {
        totalCustomDates: true,
        csrf_token: csrf,
        totalCustomDateEnd: '2018-06-01',
        totalCustomDateStart: '2019-06-01'
      };
      const { error } = Joi.validate(data, schema);
      expect(error.details[0].type).to.equal('date.greater');
    });
  });
});
