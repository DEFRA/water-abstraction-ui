'use strict';

const Joi = require('@hapi/joi');
const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const reviewForm = (request, reviewOutcome, reviewComments) => {
  const { csrfToken } = request.view;

  const action = routing.postReview(request);

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('reviewOutcome', {
    errors: {
      'any.required': {
        message: 'Select a review outcome'
      }
    },
    choices: [
      {
        value: 'approve',
        label: 'Yes, approve',
        fields: [fields.paragraph('Approval notice', {
          text: 'This licence will be added to the supplementary bill run'
        })]
      },
      {
        value: 'requestChanges',
        label: 'No, request a change',
        fields: [fields.text('reviewerComments', {
          multiline: true,
          required: true,
          errors: {
            'any.empty': {
              message: `er no`
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

const reviewFormSchema = request => {
  return {
    csrf_token: Joi.string().uuid().required(),
    reviewOutcome: Joi.string().allow('approve', 'requestChanges'),
    reviewerComents: Joi.string().optional().allow(null).when('reviewOutcome', {
      is: 'requestChanges',
      then: Joi.required(),
      otherwise: Joi.string().optional().allow(null)
    })
  };
};

exports.reviewForm = reviewForm;
exports.reviewFormSchema = reviewFormSchema;
