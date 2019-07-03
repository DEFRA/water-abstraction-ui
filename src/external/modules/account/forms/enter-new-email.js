const { formFactory, fields, setValues } = require('shared/lib/forms');
const Joi = require('joi');

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
    ...createError('any.allowOnly', 'Email addresses must match'),
    ...createError('string.email', 'Enter a valid email'),
    ...createError('any.empty', 'Enter your email')
  }));

  f.fields.push(createEmailField('confirm-email', 'Confirm your new email address', {
    ...createError('string.email', 'Enter a valid email'),
    ...createError('any.empty', 'Confirm your new email address')

  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return setValues(f, data);
};

const enterNewEmailSchema = {
  email: Joi
    .string()
    .email()
    .valid(Joi.ref('confirm-email'))
    .required(),
  'confirm-email': Joi.string().email().required(),
  csrf_token: Joi.string().required()
};

exports.enterNewEmailForm = enterNewEmailForm;
exports.enterNewEmailSchema = enterNewEmailSchema;
