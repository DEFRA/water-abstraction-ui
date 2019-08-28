const { formFactory, fields, setValues } = require('shared/lib/forms');
const Joi = require('@hapi/joi');

const createError = (key, message) => ({
  [key]: { message }
});

const createEmailField = (name, label, errors) => {
  return fields.text(name, {
    type: 'email',
    label,
    autoComplete: 'email',
    controlClass: 'govuk-input--width-20',
    errors
  });
};

const enterNewEmailForm = (request, data = {}) => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/change-email/enter-new-email');

  f.fields.push(createEmailField('email', 'Your new email address', {
    ...createError('any.allowOnly', 'The email addresses must match'),
    ...createError('string.email', 'Enter an email address, like name@example.com'),
    ...createError('any.empty', 'Enter your new email address')
  }));

  f.fields.push(createEmailField('confirm-email', 'Confirm your new email address', {
    ...createError('any.allowOnly', 'The email addresses must match'),
    ...createError('any.empty', 'Confirm your new email address')
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data);
};

const VALID_EMAIL = Joi.string().email().required();

const enterNewEmailSchema = Joi.object({
  email: VALID_EMAIL,
  'confirm-email': Joi.when('email', {
    is: VALID_EMAIL,
    then: Joi.string().required().valid(Joi.ref('email'))
  }),
  csrf_token: Joi.string().required()
});

exports.enterNewEmailForm = enterNewEmailForm;
exports.enterNewEmailSchema = enterNewEmailSchema;
