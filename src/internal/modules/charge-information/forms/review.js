'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const reviewForm = (request, reviewOutcome, reviewComments) => {
  const { csrfToken } = request.view;

  const action = routing.postReview(request.params.chargeVersionWorkflowId, request.params.licenceId);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('reviewOutcome', {
    errors: {
      'any.required': {
        message: 'Select yes to approve the charge information or no to request changes.'
      }
    },
    choices: [
      {
        value: 'approve',
        label: 'Yes, approve',
        fields: [fields.paragraph('approval_notice', {
          text: 'This licence will be added to the supplementary bill run'
        })]
      },
      {
        value: 'changes_requested',
        label: 'No, request a change',
        fields: [fields.text('reviewerComments', {
          multiline: true,
          required: true,
          errors: {
            'any.empty': {
              message: `Enter details into the box about what needs to change.`
            }
          },
          label: 'Which parts of the charge information are incorrect?',
          hint: 'Describe what needs to change. This will help the person who set up the charge information to correct it.'
        }, reviewComments)]
      }
    ]
  }, reviewOutcome));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const reviewFormSchema = () => ({
  csrf_token: Joi.string().uuid().required(),
  approval_notice: Joi.any(),
  reviewOutcome: Joi.string().required().allow('approve', 'changes_requested'),
  reviewerComments: Joi.when('reviewOutcome', {
    is: 'changes_requested',
    then: Joi.string().required()
  })
});

exports.reviewForm = reviewForm;
exports.reviewFormSchema = reviewFormSchema;
