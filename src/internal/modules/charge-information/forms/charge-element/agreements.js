'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementData, getChargeElementActionUrl } = require('../../lib/form-helpers');

const getChoices = isSection127AgreementEnabled => [{
  value: true,
  label: 'Yes, agreements should apply to this element'
}, {
  value: false,
  label: 'No, exclude this element from two-part tariff agreements'
}];

/**
 * Form to select if two-part tariff (section 127) agreement should be
 * disabled at element level
 *
 * @param {Object} request The Hapi request object
 * @param {Boolean}  data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view;
  const { licence } = request.pre;

  const data = getChargeElementData(request);

  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.agreements);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('isSection127AgreementEnabled', {
    caption: `Licence ${licence.licenceNumber}`,
    label: 'Should agreements apply to this element?',
    heading: true,
    hint: 'Normally, an agreement will apply to all elements',
    errors: {
      'any.required': {
        message: 'Select a loss category'
      }
    },
    choices: getChoices(),
    mapper: 'booleanMapper'
  }, data.isSection127AgreementEnabled));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = (request) => {
  return {
    csrf_token: Joi.string().uuid().required(),
    isSection127AgreementEnabled: Joi.boolean().required()
  };
};

exports.schema = schema;

exports.form = form;
