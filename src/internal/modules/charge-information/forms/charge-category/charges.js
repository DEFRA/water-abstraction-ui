'use strict';

const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms/');
const { CHARGE_CATEGORY_STEPS } = require('../../lib/charge-categories/constants');
const { getChargeCategoryActionUrl, getChargeCategoryData } = require('../../lib/form-helpers');

const getRadioField = (licenceNumber, value) => fields.radio('charges', {
  caption: `Licence ${licenceNumber}`,
  label: 'Do additional charges apply?',
  heading: true,
  errors: {
    'any.required': {
      message: 'Select if additional charges should apply'
    }
  },
  choices: [
    // {
    //   value: true,
    //   label: 'Yes'
    // },
    {
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

  const action = getChargeCategoryActionUrl(request, CHARGE_CATEGORY_STEPS.charges);
  const f = formFactory(action, 'POST');

  const { charges } = getChargeCategoryData(request);
  f.fields.push(
    getRadioField(licenceNumber, charges)
  );
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  charges: Joi.boolean().required()
});

exports.schema = schema;
exports.form = form;
