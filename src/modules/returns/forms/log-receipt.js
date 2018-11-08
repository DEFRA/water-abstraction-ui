const Joi = require('joi');
const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('../../../lib/forms');
const { STEP_LOG_RECEIPT, getPath } = require('../lib/flow-helpers');

const form = (request, data) => {
  const { csrfToken } = request.view;
  const action = getPath(STEP_LOG_RECEIPT, request);

  const f = formFactory(action);
  const dateReceived = get(data, 'receivedDate') || moment().format('YYYY-MM-DD');

  const minDate = moment().subtract(1, 'years').format('D MMMM YYYY');

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  f.fields.push(fields.date('date_received', {
    label: 'Enter date received',
    hint: 'For example, 31 3 2018',
    errors: {
      'any.required': {
        message: 'Enter a valid date'
      },
      'date.isoDate': {
        message: 'Enter a valid date'
      },
      'date.max': {
        message: 'Enter a date that is not in the future'
      },
      'date.min': {
        message: `The earliest date that can be entered is ${minDate}`
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
  const minDate = moment().subtract(1, 'years').format('YYYY-MM-DD');
  return {
    csrf_token: Joi.string().guid().required(),
    date_received: Joi.date().max('now').min(minDate).iso()
  };
};

module.exports = {
  logReceiptForm: form,
  logReceiptSchema: getSchema
};
