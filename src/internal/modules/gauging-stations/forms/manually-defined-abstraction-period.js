const Joi = require('joi');
const { capitalize, has } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');

const session = require('../lib/session');

const VALID_DAY = Joi.number().integer().min(1).max(31).required();
const VALID_MONTH = Joi.number().integer().min(1).max(12).required();

const errors = {
  empty: {
    message: 'Enter a start and end date for the abstraction period'
  },
  invalidStart: {
    message: 'Enter a real start date'
  },
  invalidEnd: {
    message: 'Enter a real end date'
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
      'any.empty': errors.empty,
      'string.isoDate': errors[`invalid${name}`],
      'date.isoDate': errors[`invalid${name}`],
      'date.base': errors[`invalid${name}`]
    }
  }, date);
};

const getSessionDates = (key, data) => data[`${key}Date`].value;

const abstractionPeriodForm = request => {
  const f = formFactory(request.path);

  const data = session.get(request);

  f.fields.push(getFormField('start', getSessionDates('start', data)));
  f.fields.push(getFormField('end', getSessionDates('end', data)));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const abstractionPeriodSchema = () => Joi.object({
  csrf_token: Joi.string().uuid().required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required()
});

exports.form = abstractionPeriodForm;
exports.schema = abstractionPeriodSchema;
