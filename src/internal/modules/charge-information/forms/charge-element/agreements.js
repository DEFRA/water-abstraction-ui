'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { getChargeElementData } = require('../../lib/form-helpers');
const { CHARGE_ELEMENT_STEPS } = require('../../lib/charge-elements/constants');
const { getChargeElementActionUrl } = require('../../lib/form-helpers');

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
      message: 'Select if agreements should apply to this element'
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
 */
const form = request => {
  const { csrfToken } = request.view;
  const { licence: { licenceNumber } } = request.pre;

  const action = getChargeElementActionUrl(request, CHARGE_ELEMENT_STEPS.agreements);
  const f = formFactory(action, 'POST');

  const { isSection127AgreementEnabled } = getChargeElementData(request);
  f.fields.push(
    getRadioField(licenceNumber, isSection127AgreementEnabled)
  );
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = Joi.object({
  csrf_token: Joi.string().uuid().required(),
  isSection127AgreementEnabled: Joi.boolean().required()
});

exports.schema = schema;
exports.form = form;
