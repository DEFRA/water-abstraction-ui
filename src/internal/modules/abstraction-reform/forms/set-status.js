const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms');
const { isARApprover } = require('../../../lib/permissions');

const {
  STATUS_IN_PROGRESS,
  STATUS_IN_REVIEW,
  STATUS_APPROVED,
  STATUS_NALD_UPDATE,
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
    value: STATUS_NALD_UPDATE,
    label: 'NALD update'
  },
  {
    value: STATUS_LICENCE_REVIEW,
    label: 'Mark for full licence review'
  }
];

const agentChoices = [
  {
    value: STATUS_IN_REVIEW,
    label: 'Review'
  },
  {
    value: STATUS_NALD_UPDATE,
    label: 'NALD update'
  }
];

const getNotesField = () => {
  return fields.text('notes', {
    required: false,
    multiline: true,
    label: 'Notes about these changes (optional)'
  });
};

const getStatusField = isApprover => {
  if (isApprover) {
    return fields.radio('status', {
      label: 'Do you approve these edits?',
      choices,
      errors: {
        'any.required': {
          message: 'Select if you approve these edits'
        }
      }
    });
  }
  return fields.radio('status', {
    label: 'Submit for',
    choices: agentChoices,
    errors: {
      'any.required': {
        message: 'Select a status'
      }
    }
  });
};

const getSubmitButton = isApprover => {
  const buttonText = isApprover ? 'Save decision' : 'Submit';
  return fields.button(null, { label: buttonText });
};

/**
 * Get form object to set AR document status (and optionally leave notes)
 * @param {Object} request - HAPI request instance
 * @return {Object} form object
 */
const setStatusForm = (request) => {
  const { csrfToken } = request.view;

  const { documentId } = request.params;
  const action = `/digitise/licence/${documentId}/status`;

  const f = formFactory(action);

  f.fields.push();

  const isApprover = isARApprover(request);
  f.fields.push(getNotesField());
  f.fields.push(getStatusField(isApprover));
  f.fields.push(getSubmitButton(isApprover));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  return f;
};

/**
 * Gets Joi schema for set status form
 * @param {Object} request - HAPI request instance
 * @return {Object} Joi schema
 */
const setStatusSchema = (request) => {
  const isApprover = isARApprover(request);
  const validStatus = isApprover ? [STATUS_IN_PROGRESS,
    STATUS_APPROVED,
    STATUS_NALD_UPDATE,
    STATUS_LICENCE_REVIEW] : [STATUS_IN_REVIEW, STATUS_NALD_UPDATE];
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
