const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');

/**
 * Creates an object to represent the form for capturing the
 * new user's email address.
 *
 * @param {Object} request The Hapi request object
 * @param {String} email The user's email address
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
      'array.includesRequiredUnknowns': { message: 'Tick the box to confirm you want to delete the account' }
    }
  }));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Confirm' }));

  return f;
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  confirmDelete: Joi.array().length(1).items(Joi.valid('confirm').required())
};

exports.deleteUserForm = form;
exports.deleteUserSchema = schema;
