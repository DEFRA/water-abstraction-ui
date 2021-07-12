const Joi = require('joi');
const { get } = require('lodash');
const moment = require('moment');
const { formFactory, fields } = require('shared/lib/forms');

const { STEP_LOG_RECEIPT } = require('shared/modules/returns/steps');
const { addQuery } = require('shared/modules/returns/route-helpers');
const { getUnderQueryField } = require('./fields/under-query');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const getMinimumDate = () => moment().subtract(1, 'years');

const getDateField = dateReceived => {
  const minDate = getMinimumDate().format('D MM YYYY');
  return fields.date('dateReceived', {
    label: 'When was the return received?',
    subHeading: true,
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
    } }, dateReceived);
};

const form = (request, data) => {
  const dateReceived = get(data, 'receivedDate') || moment().format('YYYY-MM-DD');

  return {
    ...formFactory(addQuery(request, STEP_LOG_RECEIPT)),
    fields: [
      getDateField(dateReceived),
      getUnderQueryField(data.isUnderQuery),
      getCsrfTokenField(request),
      getContinueField('Submit')
    ]
  };
};

/**
 * Gets validation schema for log receipt form
 * @return {Object} Joi validation schema
 */
const getSchema = () => {
  const minDate = getMinimumDate().format('YYYY-MM-DD');
  return {
    csrf_token: Joi.string().guid().required(),
    dateReceived: Joi.date().max('now').min(minDate).iso(),
    isUnderQuery: Joi.array().items(Joi.string().valid('under_query'))
  };
};

module.exports = {
  logReceiptForm: form,
  logReceiptSchema: getSchema
};
