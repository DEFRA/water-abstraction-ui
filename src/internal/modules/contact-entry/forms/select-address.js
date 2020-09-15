const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const { uniqBy } = require('lodash');
const { getAddressText } = require('../helpers');

const getAddressChoices = addresses => {
  const choices = [...uniqBy(addresses, entity => [entity.address.id].join()).map(record => {
    return ({
      value: record.address.id,
      label: getAddressText(record.address)
    });
  }), { divider: 'or' }];
  return [...choices.length > 1 ? choices : [], {
    value: 'new',
    label: 'Set up a new address'
  }];
};

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;
  const { addressSearchResults } = request.pre;

  const f = formFactory('/contact-entry/select-address');

  f.fields.push(fields.radio('id', {
    errors: {
      'any.required': {
        message: 'Select an address from the list'
      }
    },
    label: 'Select an address',
    choices: getAddressChoices(addressSearchResults)
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  id: Joi.string().uuid().required().allow('new')
};

exports.form = form;
exports.schema = schema;
