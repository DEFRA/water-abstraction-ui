const Joi = require('joi');
const { formFactory, fields } = require('../../../lib/forms');

const {
  STATUS_IN_PROGRESS,
  STATUS_IN_REVIEW,
  STATUS_APPROVED,
  STATUS_LICENCE_REVIEW
} = require('../lib/statuses');

const choices = [
  {
    value: STATUS_IN_PROGRESS,
    label: 'No'
  },
  {
    value: STATUS_APPROVED,
    label: 'Approved'
  },
  {
    value: STATUS_LICENCE_REVIEW,
    label: 'Mark for full licence review'
  }
];

/**
 * Get form object to set AR document status (and optionally leave notes)
 * @param {Object} request - HAPI request instance
 * @return {Object} form object
 */
const setStatusForm = (request) => {
  const { csrfToken } = request.view;

  const { documentId } = request.params;
  const action = `/admin/abstraction-reform/licence/${documentId}/status`;

  const f = formFactory(action);

  f.fields.push(fields.text('notes', { required: false, multiline: true, label: 'Notes about these changes (optional)' }));

  const isApprover = request.permissions.hasPermission('ar.approve');

  if (isApprover) {
    f.fields.push(fields.radio('status', {
      label: 'Do you approve these edits?',
      choices,
      errors: {
        'any.required': {
          message: 'Select if you approve these edits'
        }
      }
    }));
  } else {
    f.fields.push(fields.text('status', { hidden: true }, STATUS_IN_REVIEW));
  }

  const buttonText = isApprover ? 'Save decision' : 'Submit for approval';

  f.fields.push(fields.button(null, { label: buttonText }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

/**
 * Gets Joi schema for set status form
 * @param {Object} request - HAPI request instance
 * @return {Object} Joi schema
 */
const setStatusSchema = (request) => {
  const isApprover = request.permissions.hasPermission('ar.approve');
  const validStatus = isApprover ? [STATUS_IN_PROGRESS,
    STATUS_IN_REVIEW,
    STATUS_APPROVED,
    STATUS_LICENCE_REVIEW] : STATUS_IN_REVIEW;
  return {
    csrf_token: Joi.string().guid().required(),
    notes: Joi.string().allow(''),
    status: Joi.string().required().valid(validStatus)
  };
};

module.exports = {
  setStatusForm,
  setStatusSchema
};
