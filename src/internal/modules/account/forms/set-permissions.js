const Joi = require('@hapi/joi');
const { get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getEmailRegex } = require('../helpers');

const choices = [
  {
    value: 'basic',
    label: 'Basic access',
    hint: 'View licences and returns.'
  },
  {
    value: 'billing_and_data',
    label: 'Billing and Data',
    hint: 'Send returns communications, monitor statistics and edit data.'
  },
  {
    value: 'environment_officer',
    label: 'Environment Officer',
    hint: 'Send hands-off flow notifications.'
  },
  {
    value: 'nps',
    label: 'National Permitting Service',
    hint: 'Send renewals.'
  },
  {
    value: 'nps_ar_user',
    label: 'National Permitting Service and Digitise! editor',
    hint: 'Send renewals and digitise licence information.'
  },
  {
    value: 'nps_ar_approver',
    label: 'National Permitting Service and Digitise! approver ',
    hint: 'Send renewals, digitise licence information and approve changes.'
  },
  {
    value: 'psc',
    label: 'Permitting and Support Centre ',
    hint: 'Send renewals.'
  },
  {
    value: 'wirs',
    label: 'Waste and Industry Regulatory Service',
    hint: 'Process returns. '
  }
];

/**
 * Creates an object representing the form for assigning a permissions group
 * to a user.
 * @param {Object} request The Hapi request
 * @param {String} permission The key for the currently assigned group (e.g. basic|psc|wirs)
 */
const form = (request, permission) => {
  const { csrfToken } = request.view;

  const f = formFactory('/account/create-user/set-permissions');

  f.fields.push(fields.radio('permission', {
    choices,
    errors: {
      'any.required': { message: 'Select the permissions for the user' },
      'any.allowOnly': { message: 'Select the permissions for the user' }
    }
  }));

  const newAccountEmail = get(request, 'yar._store.newInternalUserAccountEmail');
  f.fields.push(fields.hidden('newUserEmail', {}, newAccountEmail));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return setValues(f, { permission });
};

const schema = {
  csrf_token: Joi.string().uuid().required(),
  newUserEmail: Joi.string().email().lowercase().trim().regex(getEmailRegex()),
  permission: Joi.string().required().valid(choices.map(choice => choice.value))
};

exports.setPermissionsForm = form;
exports.setPermissionsSchema = schema;
