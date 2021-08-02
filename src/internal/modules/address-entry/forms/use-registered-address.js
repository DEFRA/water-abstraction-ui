'use strict';

const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms');
const { isEqual, pick, isEmpty, get } = require('lodash');
const session = require('../lib/session');

const ADDRESS_FIELDS = ['addressLine1', 'addressLine2', 'addressLine3', 'addressLine4', 'town', 'county', 'postcode', 'country'];

const getAddressForComparison = address => pick(address, ADDRESS_FIELDS);

const isSameAddress = (addressA, addressB) => isEqual(
  ...[addressA, addressB].map(getAddressForComparison)
);

/**
 * Gets the form value - this is a boolean value if the address is set, or null otherwise
 * @param {Object} request
 * @return {Boolean|null}
 */
const isRegisteredAddressSelected = request => {
  // Get the address from session data
  const { key } = request.params;
  const address = get(session.get(request, key), 'data', {});

  // Get registered address from request.pre
  const { address: registeredAddress } = request.pre.company;

  return isEmpty(address) ? null : isSameAddress(address, registeredAddress);
};

/**
 * Creates an object to represent the form for capturing the
 * UK postcode to use for looking up addresses
 *
 * @param {Object} request The Hapi request object
 * @param {String} postcode The UK postcode
 */
const form = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path);

  f.fields.push(fields.radio('useRegisteredAddress', {
    label: 'Use the registered office address?',
    subHeading: true,
    mapper: 'booleanMapper',
    choices: [
      {
        value: true,
        label: 'Yes'
      },
      {
        value: false,
        label: 'No'
      }
    ],
    errors: {
      'any.required': {
        message: 'Select whether to use the registered office address'
      }
    }
  }, isRegisteredAddressSelected(request)));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  useRegisteredAddress: Joi.boolean().required()
});

exports.form = form;
exports.schema = schema;
