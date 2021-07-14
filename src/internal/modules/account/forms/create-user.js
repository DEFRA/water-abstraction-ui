const Joi = require('joi');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const config = require('internal/config');

const getEmailRegex = () => {
  return (config.isLocal || config.testMode)
    ? /(\.gov\.uk|gmail\.com)$/
    : /\.gov\.uk$/;
};

const getEmailErrors = () => {
  return ['string.pattern.base', 'string.email', 'string.empty'].reduce((acc, key) => {
    return {
      ...acc,
      [key]: { message: 'Enter a valid email' }
    };
  }, {});
};

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
 *
 * @param {Object} request The Hapi request object
 * @param {String} email The user's email address
 */
const form = (request, email) => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/create-user');

  f.fields.push(fields.text('email', {
    label: 'Enter a gov.uk email address',
    errors: getEmailErrors()
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return setValues(f, { email });
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  email: Joi.string().email().lowercase().trim().regex(getEmailRegex())
});

exports.createUserForm = form;
exports.createUserSchema = schema;
exports.getEmailRegex = getEmailRegex;
