'use strict';

const { get } = require('lodash');
const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const { getCommonErrors, getDateValidator } = require('./lib/date-picker');
const { getFormAction } = require('./lib/routing');

const getDateErrors = (isDateSignedKnown, endDate) => {
  const errors = {
    ...getCommonErrors(endDate)
  };
  if (isDateSignedKnown) {
    errors['any.required'] = {
      message: 'Enter the date the agreement was signed',
      summary: 'Enter the date the agreement was signed'
    };
  }
  return errors;
};
/**
 * Gets form to select agreement signed date
 */
const dateSignedForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory(getFormAction(request), 'POST');

  const { isDateSignedKnown, dateSigned } = get(request, 'pre.flowState');

  const { endDate } = request.pre.licence;

  f.fields.push(fields.radio('isDateSignedKnown', {
    label: 'Do you know the date the agreement was signed?',
    heading: true,
    size: 'l',
    errors: {
      'any.required': {
        message: 'Select yes if you know the date the agreement was signed'
      }
    },
    choices: [{
      value: true,
      label: 'Yes',
      fields: [
        fields.date('dateSigned', {
          type: 'date',
          mapper: 'dateMapper',
          controlClass: 'form-control form-control--small',
          errors: getDateErrors(isDateSignedKnown, endDate)
        }, dateSigned)]
    }, {
      value: false,
      label: 'No'
    }]
  }, isDateSignedKnown));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const dateSignedSchema = (request, refDate) => {
  const { licence } = request.pre;
  return {
    csrf_token: Joi.string().uuid().required(),
    isDateSignedKnown: Joi.boolean().required(),
    dateSigned: Joi.when('isDateSignedKnown', {
      is: true,
      then: getDateValidator(licence)
    })
  };
};

exports.form = dateSignedForm;
exports.schema = dateSignedSchema;
