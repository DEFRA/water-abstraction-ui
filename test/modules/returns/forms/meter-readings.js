const Joi = require('joi');
const { expect } = require('code');
const { experiment, test } = exports.lab = require('lab').script();
const { meterReadingsSchema } = require('../../../../src/modules/returns/forms/meter-readings');

const data = {
  meters: [{
    startReading: 10
  }],
  lines: [
    { startDate: '2017-01-01', endDate: '2017-01-31', timePeriod: 'month', quantity: null },
    { startDate: '2017-02-01', endDate: '2017-02-28', timePeriod: 'month', quantity: null },
    { startDate: '2017-03-01', endDate: '2017-03-30', timePeriod: 'month', quantity: null },
    { startDate: '2017-04-01', endDate: '2017-04-30', timePeriod: 'month', quantity: null }
  ]
};

const createFormValues = (jan, feb, mar, apr) => ({
  '2017-01-01_2017-01-31': jan,
  '2017-02-01_2017-02-28': feb,
  '2017-03-01_2017-03-30': mar,
  '2017-04-01_2017-04-30': apr,
  csrf_token: '4a95f0e2-4861-49ef-af95-0a269fae982c'
});

experiment('meterReadingsSchema', () => {
  test('is valid for all null values', async () => {
    const formValues = createFormValues(null, null, null, null);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.be.null();
  });

  test('is valid for incrementing numbers', async () => {
    const formValues = createFormValues(11, 12, 13, 14);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.be.null();
  });

  test('is valid for equal numbers', async () => {
    const formValues = createFormValues(10, 10, 10, 10);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.be.null();
  });

  test('handles null in between numeric readings', async () => {
    const formValues = createFormValues(10, 20, null, 30);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.be.null();
  });

  test('handles multiple nulls in between numeric readings', async () => {
    const formValues = createFormValues(null, null, null, 30);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.be.null();
  });

  test('not valid if first reading is less than start reading', async () => {
    const formValues = createFormValues(5, 20, 30, 40);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.not.be.null();
  });

  test('not valid if all readings are less than start reading', async () => {
    const formValues = createFormValues(5, 5, 5, 5);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.not.be.null();
  });

  test('not valid if a reading is lower than an earlier reading', async () => {
    const formValues = createFormValues(20, 20, 20, 10);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.not.be.null();
  });

  test('not valid if a reading is lower than an earlier reading using larger numbers', async () => {
    const formValues = createFormValues(2000000000, 3000000000, 2000000001, 4000000000);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.not.be.null();
  });

  test('not valid if a reading at end is lower', async () => {
    const formValues = createFormValues(20, 30, null, 10);
    const schema = meterReadingsSchema(data, formValues);
    const result = Joi.validate(formValues, schema, { abortEarly: false });
    expect(result.error).to.not.be.null();
  });
});
