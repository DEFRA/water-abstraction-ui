const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const form = (request, accountTypeDefaultValue, personNameDefaultValue) => {
  const { csrfToken } = request.view;
  const { sessionKey } = request.query;

  const f = formFactory('/contact-entry/new/account-type');

  f.fields.push(fields.radio('accountType', {
    errors: {
      'any.required': {
        message: 'Select an option'
      }
    },
    choices: [
      { value: 'organisation', label: 'Company or organisation' },
      {
        value: 'person',
        label: 'Individual',
        fields: [fields.text('personName', {
          errors: {
            'any.empty': {
              message: `Enter the full name`
            }
          },
          label: 'Full name'
        }, personNameDefaultValue)]
      }]
  }, accountTypeDefaultValue));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.hidden('sessionKey', {}, sessionKey));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  sessionKey: Joi.string().uuid().required(),
  accountType: Joi.string().required().allow(['organisation', 'person']),
  personName: Joi.when('accountType', {
    is: 'organisation',
    then: Joi.string().required()
  })
};

exports.form = form;
exports.schema = schema;
