const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');
const { uniqBy } = require('lodash');

const getContactChoices = contacts => {
  const choices = [...uniqBy(contacts, entity => [entity.id].join()).map(contact => ({
    value: contact.id,
    label: contact.name
  })), { divider: 'or' }];
  return [...choices.length > 1 ? choices : [], {
    value: 'new',
    label: 'Set up a new contact'
  }];
};

const form = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey, searchQuery, back, regionId, originalCompanyId } = request.query;
  const { contactSearchResults } = request.pre;

  const f = formFactory('/contact-entry/select-contact');

  f.fields.push(fields.radio('id', {
    errors: {
      'any.required': {
        message: contactSearchResults.length >= 1 ? 'Select an existing contact, or set up a new contact' : `Select 'Set up a new contact'`
      }
    },
    label: 'Select a contact',
    choices: getContactChoices(contactSearchResults)
  }, defaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('back', {}, back));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.hidden('originalCompanyId', {}, originalCompanyId));
  f.fields.push(fields.hidden('regionId', {}, regionId));
  f.fields.push(fields.hidden('searchQuery', {}, searchQuery));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  searchQuery: Joi.string(),
  back: Joi.string(),
  regionId: Joi.string().uuid().required(),
  originalCompanyId: Joi.string().uuid().required(),
  id: Joi.string().uuid().required()
};

exports.form = form;
exports.schema = schema;
