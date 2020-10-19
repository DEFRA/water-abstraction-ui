
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

const selectExistingCompanyForm = (request, defaultValue) => {
  const { csrfToken } = request.view;
  const { contactSearchResults } = request.pre;
  const { filter } = request.query;
  const { regionId, companyId } = request.params;

  const f = formFactory(`/invoice-accounts/create/${regionId}/${companyId}/contact-search`);

  f.fields.push(fields.radio('id', {
    errors: {
      'any.required': {
        message: contactSearchResults.length >= 1 ? 'Select an existing contact, or set up a new contact' : `Select 'Set up a new contact'`
      }
    },
    choices: getContactChoices(contactSearchResults)
  }, defaultValue));
  f.fields.push(fields.hidden('filter', {}, filter));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectExistingCompanySchema = {
  csrf_token: Joi.string().uuid().required(),
  filter: Joi.string().required(),
  id: Joi.string().uuid().allow('new').required()
};

exports.selectExistingCompanyForm = selectExistingCompanyForm;
exports.selectExistingCompanySchema = selectExistingCompanySchema;
