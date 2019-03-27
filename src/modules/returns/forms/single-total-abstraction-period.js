const Joi = require('joi');
const moment = require('moment');
const { pick, first, last } = require('lodash');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getPath, STEP_SINGLE_TOTAL_DATES } = require('../lib/flow-helpers');
const { getFormLines } = require('../lib/return-helpers');

const dateError = {
  message: 'Enter a date in the right format, for example 31 3 2018',
  summary: 'Enter a date in the right format'
};

const form = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_SINGLE_TOTAL_DATES, request);

  const f = formFactory(action);

  f.fields.push(fields.radio('totalCustomDates', {
    label: 'What period was used for this volume?',
    errors: {
      'any.required': {
        summary: 'Select the period used for this volume',
        message: 'Select the period used for this volume'
      }
    },
    choices: [
      {
        value: false,
        label: 'Default abstraction period'
      },
      {
        value: true,
        label: 'Custom dates',
        fields: [
          fields.date('totalCustomDateStart', {
            type: 'date',
            mapper: 'dateMapper',
            controlClass: 'form-control form-control--small',
            errors: {
              'any.required': dateError,
              'string.isoDate': dateError,
              'date.isoDate': dateError,
              'date.base': dateError,
              'date.min': {
                message: 'Enter a date from the start of the abstraction period'
              }
            }
          }),
          fields.paragraph(null, {
            text: 'to',
            controlClass: 'bold'
          }),
          fields.date('totalCustomDateEnd', {
            type: 'date',
            mapper: 'dateMapper',
            controlClass: 'form-control form-control--small',
            errors: {
              'any.required': dateError,
              'string.isoDate': dateError,
              'date.isoDate': dateError,
              'date.base': dateError,
              'date.greater': {
                message: 'Enter an end date after the start date'
              },
              'date.max': {
                message: 'Enter a date up to the end of the abstraction period'
              }
            }
          })
        ]
      }
    ]
  }));

  f.fields.push(fields.button(null, { label: 'Continue' }));
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const formData = pick(data.reading, 'totalCustomDates', 'totalCustomDateStart', 'totalCustomDateEnd');
  return setValues(f, formData);
};

const formatLineDateForValidation = date => moment(date, 'YYYY-MM-DD').format('MM-DD-YYYY');

const schema = returnData => {
  const lines = getFormLines(returnData);
  const startDate = formatLineDateForValidation(first(lines).startDate);
  const endDate = formatLineDateForValidation(last(lines).endDate);

  return {
    totalCustomDates: Joi.boolean().required(),
    totalCustomDateStart: Joi.when('totalCustomDates', {
      is: true,
      then: Joi.date().required().min(startDate)
    }),
    totalCustomDateEnd: Joi.when('totalCustomDates', {
      is: true,
      then: Joi.date().max(endDate).greater(Joi.ref('totalCustomDateStart')).required()
    }),
    csrf_token: Joi.string().guid().required()
  };
};

exports.singleTotalAbstractionPeriodForm = form;
exports.singleTotalAbstractionPeriodSchema = schema;
