const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const getContactChoices = contacts => {
  const choices = contacts.map(contact => ({
    value: contact.id,
    label: contact.name
  }));
  return [...choices, { divider: 'or' }, {
    value: null,
    label: 'Another billing contact'
  }];
};

const form = (request, id) => {
  const { csrfToken } = request.view;
  const { sessionKey, redirectPath, searchQuery } = request.query;
  const { contactSearchResults } = request.pre;

  const f = formFactory('/contact-entry/select-contact');

  f.fields.push(fields.radio('id', {
    errors: {
      'any.empty': {
        message: 'Select a contact from the list'
      },
      'string.regex.base': {
        message: 'Select a contact from the list'
      }
    },
    label: 'Select a contact',
    choices: getContactChoices(contactSearchResults)
  }, id));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('redirectPath', {}, redirectPath));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.hidden('searchQuery', {}, searchQuery));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  redirectPath: Joi.string().required(),
  sessionKey: Joi.string().uuid().required(),
  searchQuery: Joi.string(),
  id: Joi.string().uuid().required()
};

exports.form = form;
exports.schema = schema;
