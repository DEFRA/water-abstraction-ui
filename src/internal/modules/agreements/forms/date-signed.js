'use strict';

const { get } = require('lodash');
const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const { getMaxDate, getCommonErrors, getDateValidator } = require('./lib/date-picker');

/**
 * Gets form to select agreement signed date
 */
const dateSignedForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path, 'POST');

  const dateSigned = get(request, 'pre.flowState.dateSigned');

  const { endDate } = request.pre.licence;

  f.fields.push(fields.date('dateSigned', {
    label: 'Enter date agreement was signed',
    heading: true,
    size: 'l',
    errors: {
      'date.isoDate': {
        message: 'Enter the date the agreement was signed'
      },
      ...getCommonErrors(endDate)
    }
  }, dateSigned));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const dateSignedSchema = (request, refDate) => {
  const { licence } = request.pre;
  return {
    csrf_token: Joi.string().uuid().required(),
    dateSigned: getDateValidator(licence)
  };
};

exports.form = dateSignedForm;
exports.schema = dateSignedSchema;
