const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { groupLicenceConditions } = require('../lib/helpers');

const checkFormMultipleCheckbox = request => {
  const f = formFactory(request.path);
  const mySession = session.get(request);
  const dataCheckboxChoices = groupLicenceConditions(request);

  f.fields.push(fields.checkbox('selectedCondition', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'array.min': {
        message: 'At least one condition must be selected'
      },
      'array.required': {
        message: 'Select a licence tag'
      },
      'array.empty': {
        message: 'Select a licence tag'
      },
      'any.required': {
        message: 'Select a licence tag'
      },
      'any.empty': {
        message: 'Select a licence tag'
      }
    },
    choices: dataCheckboxChoices.filter(itemLabel => itemLabel.licenceId === mySession.selectedLicence.value)[0].linkages
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));
  return f;
};

const checkSchemaMultipleCheckbox = () => Joi.object({
  selectedCondition: Joi.array().min(1),
  csrf_token: Joi.string().uuid().required()
});

exports.form = checkFormMultipleCheckbox;
exports.schema = checkSchemaMultipleCheckbox;
