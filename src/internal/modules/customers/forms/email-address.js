const Joi = require('joi');
const { get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const session = require('../session');

const emailAddressForm = request => {
  const f = formFactory(request.path);

  const defaultEmailValue =
    get(session.get(request), 'email.value') ||
    get(session.get(request), 'emailAddressFromDatabase');

  f.fields.push(fields.text('email', {
    errors: {
      'string.empty': {
        message: 'Enter a valid email address'
      },
      'string.email': {
        message: 'Enter a valid email address'
      }
    }
  }, defaultEmailValue));

  f.fields.push(fields.hidden('isNew', {}, request.query.isNew));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const emailAddressSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  email: Joi.string().email().required(),
  isNew: Joi.number().optional()
});

exports.form = emailAddressForm;
exports.schema = emailAddressSchema;
