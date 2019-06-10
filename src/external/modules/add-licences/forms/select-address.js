const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('joi');

const getLines = licences => {
  return licences.map(licence => {
    const labelItems = [licence.metadata.AddressLine1,
      licence.metadata.AddressLine2,
      licence.metadata.AddressLine3,
      licence.metadata.AddressLine4,
      licence.metadata.Town,
      licence.metadata.County,
      licence.metadata.Postcode
    ].filter(label => label !== ''); ;

    return { value: licence.document_id,
      label: `${labelItems.join(', ')}`
    };
  });
};

/**
 * form for page to enter FAO information
 * @param  {Object} request HAPI request object
 * @return {Object} form object with FAO text field, hidden CSRF and AddressId and Continue button
 */
const selectAddressForm = (request, licences) => {
  const { csrfToken } = request.view;
  const { selectedAddressId } = request.yar.get('addLicenceFlow');

  const action = '/select-address';

  const f = formFactory(action);

  const lines = getLines(licences);

  f.fields.push(fields.radio('selectedAddressId', {
    errors: {
      'any.required': {
        message: 'Select an address'
      },
      'any.allowOnly': {
        message: 'Address is invalid'
      }
    },
    choices: lines
  }, selectedAddressId));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

const selectAddressSchema = licences => {
  const documentIds = licences.map(licence => licence.document_id);
  return {
    selectedAddressId: Joi.string().guid().required().valid(documentIds),
    csrf_token: Joi.string().guid().required()
  };
};

exports.selectAddressForm = selectAddressForm;
exports.selectAddressSchema = selectAddressSchema;
