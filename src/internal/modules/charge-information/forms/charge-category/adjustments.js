'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryActionUrl, getChargeCategoryData } = require('../../lib/form-helpers');

const getRadioField = (licenceNumber, value) => fields.radio('adjustments', {
  caption: `Licence ${licenceNumber}`,
  label: 'Do adjustments apply?',
  heading: true,
  hint: 'Adjustments include any discounts or agreements that should apply to this charge',
  errors: {
    'any.required': {
      message: 'Select if adjustments should apply'
    }
  },
  choices: [{
    value: true,
    label: 'Yes'
  }, {
    value: false,
    label: 'No'
  }],
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

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.adjustments);
  const f = formFactory(action, 'POST');

  const { adjustments } = getChargeCategoryData(request);
  f.fields.push(
    getRadioField(licenceNumber, adjustments)
  );
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  adjustments: Joi.boolean().required()
});

exports.schema = schema;
exports.form = form;
