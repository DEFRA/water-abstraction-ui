const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
 *
 * @param {Object} request The Hapi request object
 * @param {String} userEmail The user's email address
 */
const form = (request, userEmail) => {
  const { csrfToken } = request.view;

  const f = formFactory(`/account/delete-account/${request.params.userId}`);

  f.fields.push(fields.checkbox('confirmDelete', {
    choices: [{
      htmlLabel: `Yes I want to delete the account for <strong>${userEmail}</strong>`,
      value: 'confirm'
    }],
    errors: {
      'any.only': { message: 'Tick the box to confirm you want to delete the account' },
      'array.min': { message: 'Tick the box to confirm you want to delete the account' },
      'array.includesRequiredUnknowns': { message: 'Tick the box to confirm you want to delete the account' }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));

  return f;
};

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  confirmDelete: Joi.array().required().min(1).items(Joi.string().required().valid('confirm')).required()
});

exports.deleteUserForm = form;
exports.deleteUserSchema = schema;
