const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../lib/session');
const { groupLicenceConditions } = require('../lib/helpers');

const checkFormMultipleCheckbox = request => {
  const f = formFactory(request.path);
  const mySession = session.get(request);
  const dataCheckboxChoices = groupLicenceConditions(request);
  const requiredMessage = 'Select a licence tag';
  f.fields.push(fields.checkbox('selectedCondition', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'array.min': {
        message: 'At least one condition must be selected'
      },
      'array.required': {
        message: requiredMessage
      },
      'array.empty': {
        message: requiredMessage
      },
      'any.required': {
        message: requiredMessage
      },
      'any.empty': {
        message: requiredMessage
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
