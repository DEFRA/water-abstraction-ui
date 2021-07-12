const Joi = require('joi');
const { capitalize, get } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');

const session = require('../lib/session');

const errors = {
  empty: {
    message: 'Enter a start and end date for the abstraction period'
  },
  invalidStart: {
    message: 'Enter the abstraction period start date'
  },
  invalidEnd: {
    message: 'Enter the abstraction period end date'
  }
};

const getFormField = (key, date) => {
  const name = capitalize(key);
  return fields.date(`${key}Date`, {
    label: `${name} date`,
    subHeading: true,
    items: ['day', 'month'],
    type: 'date',
    mapper: 'dayOfYearMapper',
    errors: {
      'any.required': errors.empty,
      'string.empty': errors.empty,
      'string.isoDate': errors[`invalid${name}`],
      'date.isoDate': errors[`invalid${name}`],
      'date.base': errors[`invalid${name}`]
    }
  }, date);
};

const getSessionDates = (key, data) => get(data[`${key}Date`], 'value', null);

const abstractionPeriodForm = request => {
  const f = formFactory(request.path);

  const data = session.get(request);

  f.fields.push(getFormField('start', getSessionDates('start', data)));
  f.fields.push(getFormField('end', getSessionDates('end', data)));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const abstractionPeriodSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required()
});

exports.form = abstractionPeriodForm;
exports.schema = abstractionPeriodSchema;
