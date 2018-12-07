const Joi = require('joi');
const { expect } = require('code');
const { test, experiment } = exports.lab = require('lab').script();
const { createSchemaFromForm } = require('../../../../src/lib/forms/validationAdapters/joi');

experiment('createSchemaFromForm', () => {
  const form = {
    fields: [
      {
        name: 'string',
        options: {}
      },
      {
        name: 'string_required',
        options: { required: true }
      },
      {
        name: 'date',
        options: { mapper: 'dateMapper' }
      },
      {
        name: 'date_required',
        options: { mapper: 'dateMapper', required: true }
      },
      {
        name: 'choice',
        options: { choices: [{
          value: 'A'
        }, {
          value: 'B'
        }]}
      },
      {
        name: 'choice_required',
        options: { choices: [{
          value: 'A'
        }, {
          value: 'B'
        }],
        required: true }
      },
      {
        name: 'choice_array',
        options: { mapper: 'arrayMapper',
          choices: [{
            value: 'A'
          }, {
            value: 'B'
          }]}
      },
      {
        name: 'choice_array_required',
        options: { mapper: 'arrayMapper',
          choices: [{
            value: 'A'
          }, {
            value: 'B'
          }],
          required: true }
      },
      {
        name: 'boolean',
        options: { mapper: 'booleanMapper' }
      },
      {
        name: 'boolean_required',
        options: { mapper: 'booleanMapper', required: true }
      }
    ]
  };

  const testSchema = {
    string: Joi.string(),
    string_required: Joi.string().required(),
    date: Joi.string().isoDate().options({convert: false}),
    date_required: Joi.string().isoDate().required().options({convert: false}),
    choice: Joi.string().valid(['A', 'B']),
    choice_required: Joi.string().valid(['A', 'B']).required(),
    choice_array: Joi.array().items(Joi.string().valid(['A', 'B'])),
    choice_array_required: Joi.array().items(Joi.string().valid(['A', 'B'])).required(),
    boolean: Joi.boolean(),
    boolean_required: Joi.boolean().required()
  };

  test('applies the function to any top level fields', async () => {
    const schema = createSchemaFromForm(form);
    expect(Joi.describe(schema)).to.equal(Joi.describe(testSchema));
  });
});
