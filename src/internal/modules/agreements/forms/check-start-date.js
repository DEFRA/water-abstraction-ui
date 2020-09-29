'use strict';

const Joi = require('@hapi/joi');

const { formFactory, fields } = require('shared/lib/forms/');
const { getCommonErrors, getDateValidator } = require('./lib/date-picker');

const getDatePicker = licenceEndDate => {
  return fields.date('startDate', {
    label: 'Start date',
    isHeading: true,
    size: 'm',
    errors: {
      'date.isoDate': {
        message: 'Enter the agreement start date'
      },
      ...getCommonErrors(licenceEndDate)
    }
  });
};

/**
 * Gets field description for financial agreement type radio buttons
 * @return {Object}
 */
const getCustomStartDateField = request => {
  const { endDate } = request.pre.licence;

  return fields.radio('isCustomStartDate', {
    mapper: 'booleanMapper',
    label: 'Do you want to set a different agreement start date?',
    heading: true,
    size: 'm',
    errors: {
      'any.required': {
        message: 'Select yes if you want to set a different agreement start date'
      }
    },
    choices: [{
      value: true,
      label: 'Yes',
      fields: [
        getDatePicker(endDate)
      ]
    }, {
      value: false,
      label: 'No'
    }]
  });
};

/**
 * Gets form to select agreement type
 */
const checkStartDateForm = request => {
  const { csrfToken } = request.view;

  const f = formFactory(request.path, 'POST');

  f.fields.push(getCustomStartDateField(request));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const checkStartDateSchema = (request, refDate) => {
  const { licence } = request.pre;
  return {
    csrf_token: Joi.string().uuid().required(),
    isCustomStartDate: Joi.boolean().required(),
    startDate: Joi.when('isCustomStartDate', {
      is: true,
      then: getDateValidator(licence)
    })
  };
};

exports.form = checkStartDateForm;
exports.schema = checkStartDateSchema;
