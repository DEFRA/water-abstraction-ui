const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');

const conditionEntryForm = (request, h) => {
  const f = formFactory(request.path);

  const { conditionsForSelectedLicence } = request.pre;

  const parsedConditions = conditionsForSelectedLicence.map((row, n) => {
    return {
      value: row.licenceVersionPurposeConditionId,
      label: `Flow cessation condition ${row.notes}`
    };
  });

  const defaultCondition = get(session.get(request), 'condition.value');

  f.fields.push(fields.radio('condition', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.empty': {
        message: 'Select a condition'
      },
      'any.required': {
        message: 'Select a condition'
      }
    },
    choices: [
      ...parsedConditions,
      ...parsedConditions.length > 0 ? [{ divider: 'or' } ] : [],
      { label: parsedConditions.length > 0 ? 'The condition is not listed for this licence' : 'No known flow conditions - Manually define an abstraction period', value: null }
    ]
  }, defaultCondition));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const conditionEntrySchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  condition: Joi.string().uuid().allow(null, '')
});

exports.form = conditionEntryForm;
exports.schema = conditionEntrySchema;
