const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

/**
 * form for page to enter FAO information
 * @param  {Object} request HAPI request object
 * @return {Object} form object with FAO text field, hidden CSRF and AddressId and Continue button
 */
const faoForm = (request) => {
  const { csrfToken } = request.view;
  const { selectedAddressId } = request.yar.get('addLicenceFlow');

  const action = `/add-addressee`;

  const f = formFactory(action);

  f.fields.push(fields.text('fao', {
    label: 'Enter a name and, or department (optional)',
    controlClass: 'govuk-!-width-one-half',
    errors: {
      'string.max': {
        message: 'Name and/or department must be 32 characters or less'
      },
      'any.allowOnly': {
        message: 'Address is invalid'
      }
    }
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('selectedAddressId', {}, selectedAddressId));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

/**
 * Gets validation schema for log receipt form
 * @return {Object} Joi validation schema
 */
const getSchema = selectedIds => {
  return {
    csrf_token: Joi.string().guid().required(),
    selectedAddressId: Joi.string().guid().required().valid(selectedIds),
    fao: Joi.string().max(32).allow('')
  };
};

exports.faoForm = faoForm;
exports.faoSchema = getSchema;
