'use strict';

const { formFactory, fields } = require('shared/lib/forms');
const Joi = require('joi');
const { accountTypes } = require('shared/lib/constants');

const form = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path);

  f.fields.push(fields.radio('accountType', {
    errors: {
      'any.required': {
        message: 'Select the account type'
      }
    },
    choices: [
      { value: accountTypes.organisation, label: 'Company' },
      { divider: 'or' },
      {
        value: accountTypes.person,
        label: 'Individual',
        fields: [fields.text('personName', {
          errors: {
            'string.empty': {
              message: `Enter the full name`
            }
          },
          label: 'Full name'
        })]
      }]
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const schema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  accountType: Joi.string().required().valid(...[accountTypes.organisation, accountTypes.person]),
  personName: Joi.when('accountType', {
    is: accountTypes.person,
    then: Joi.string().required().trim()
  })
});

exports.form = form;
exports.schema = schema;
