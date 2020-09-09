const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const titleCase = require('title-case');

const getFAOChoices = entities => {
  const choices = entities.map(entity => {
    return ({
      value: entity.contactId,
      label: titleCase(`${entity.contact.firstName} ${entity.contact.lastName}`)
    });
  });
  return [...choices, { divider: 'or' }, {
    value: null,
    label: 'Add a new person'
  }, {
    value: null,
    label: 'Add a new department'
  }];
};

const form = (request, id) => {
  const { csrfToken } = request.view;
  const { sessionKey, redirectPath } = request.query;
  const { FAOSearchResults } = request.pre;

  const f = formFactory('/contact-entry/select-address');

  f.fields.push(fields.radio('id', {
    errors: {
      'any.empty': {
        message: 'Select an address from the list'
      },
      'string.regex.base': {
        message: 'Select an address from the list'
      }
    },
    label: 'Select an address',
    choices: getFAOChoices(FAOSearchResults)
  }, id));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('redirectPath', {}, redirectPath));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  redirectPath: Joi.string().required(),
  sessionKey: Joi.string().uuid().required(),
  id: Joi.string().uuid().required()
};

exports.form = form;
exports.schema = schema;
