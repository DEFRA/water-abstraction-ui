'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { getChargeElementData } = require('../../lib/form-helpers');

const getRadioChoices = () => [{
  value: true,
  label: 'Yes, agreements should apply to this element'
}, {
  value: false,
  label: 'No, exclude this element from two-part tariff agreements'
}];

const getRadioField = (licenceNumber, value) => fields.radio('isSection127AgreementEnabled', {
  caption: `Licence ${licenceNumber}`,
  label: 'Should agreements apply to this element?',
  heading: true,
  hint: 'Normally, an agreement will apply to all elements',
  errors: {
    'any.required': {
      message: 'Select a loss category'
    }
  },
  choices: getRadioChoices(),
  mapper: 'booleanMapper'
}, value);

/**
 * Form to select if two-part tariff (section 127) agreement should be
 * disabled at element level
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const { licence: { licenceNumber } } = request.pre;

  const f = formFactory(request.path, 'POST');

  const { isSection127AgreementEnabled } = getChargeElementData(request);
  f.fields.push(
    getRadioField(licenceNumber, isSection127AgreementEnabled)
  );
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => ({
  csrf_token: Joi.string().uuid().required(),
  isSection127AgreementEnabled: Joi.boolean().required()
});

exports.schema = schema;
exports.form = form;
