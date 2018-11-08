const Joi = require('joi');
const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('../../../lib/forms');
const { STEP_LOG_RECEIPT, getPath } = require('../lib/flow-helpers');

const getMinimumDate = () => moment().subtract(1, 'years');

const form = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_LOG_RECEIPT, request);

  const f = formFactory(action);
  const dateReceived = get(data, 'receivedDate') || moment().format('YYYY-MM-DD');

  const minDate = getMinimumDate().format('D MM YYYY');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  f.fields.push(fields.date('date_received', {
    label: 'Enter date received',
    hint: 'For example, 31 3 2018',
    errors: {
      'any.required': {
        message: 'Enter a date in the right format, for example 31 3 2018'
      },
      'date.isoDate': {
        message: 'Enter a date in the right format, for example 31 3 2018'
      },
      'date.max': {
        message: `Enter a date between ${minDate} and today`
      },
      'date.min': {
        message: `Enter a date between ${minDate} and today`
      }
    }}, dateReceived));

  f.fields.push(fields.button(null, { label: 'Submit' }));

  return f;
};

/**
 * Gets validation schema for log receipt form
 * @return {Object} Joi validation schema
 */
const getSchema = () => {
  const minDate = getMinimumDate().format('YYYY-MM-DD');
  return {
    csrf_token: Joi.string().guid().required(),
    date_received: Joi.date().max('now').min(minDate).iso()
  };
};

module.exports = {
  logReceiptForm: form,
  logReceiptSchema: getSchema
};
