const Joi = require('joi');
const { formFactory, fields } = require('shared/lib/forms');
const moment = require('moment');

const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const errorMessage = {
  message: 'Enter a date in the right format, for example 31 3 2018',
  summary: 'Enter a date in the right format'
};

const getDateField = value => fields.date('customDate', {
  label: 'When was the return received?',
  errors: {
    'any.required': errorMessage,
    'string.isoDate': errorMessage
  }
}, value);

/**
 * Given a date, returns either 'today', 'yesterday' or 'custom'
 * @param  {String} date YYYY-MM-DD
 * @return {String}      today|yesterday|custom
 */
const getReceivedDate = date => {
  if (moment().isSame(date, 'day')) {
    return 'today';
  }
  if (moment().subtract(1, 'day').isSame(date, 'day')) {
    return 'yesterday';
  }
  return 'custom';
};

const getRadioField = value => fields.radio('receivedDate', {
  label: 'When was the return received?',
  subHeading: true,
  errors: {
    'any.required': {
      message: 'Select when the return was received'
    }
  },
  choices: [
    {
      label: 'Today',
      value: 'today'
    },
    {
      label: 'Yesterday',
      value: 'yesterday'
    },
    {
      label: 'Custom date',
      value: 'custom',
      fields: [
        getDateField(value)
      ]
    }
  ]
}, getReceivedDate(value));

exports.form = (request, data) => ({
  ...formFactory(),
  fields: [
    getCsrfTokenField(request),
    getRadioField(data.receivedDate),
    getContinueField()
  ]
}
);

exports.schema = () => ({
  csrf_token: Joi.string().guid(),
  receivedDate: Joi.string().required().valid(['today', 'yesterday', 'custom']),
  customDate: Joi.when('receivedDate', {
    is: 'custom',
    then: Joi.string().isoDate().options({ convert: false })
  })
});
