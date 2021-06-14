const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');

const licenceEntryForm = request => {
  const f = formFactory(request.path);

  f.fields.push(fields.text('selectedLicenceNumber', {
    controlClass: 'govuk-input govuk-input--width-10',
    errors: {
      'any.required': {
        message: 'Enter a valid licence number'
      }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const licenceEntrySchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  selectedLicenceNumber: Joi.string().required()
});

exports.form = licenceEntryForm;
exports.schema = licenceEntrySchema;
