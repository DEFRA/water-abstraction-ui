const Joi = require('joi');
const moment = require('moment');
const { first, last, get } = require('lodash');
const { formFactory, fields, setValues } = require('shared/lib/forms');
const { getContinueField, getCsrfTokenField } =
 require('shared/modules/returns/forms/common');

const dateError = {
  message: 'Enter a date in the right format, for example 31 3 2018',
  summary: 'Enter a date in the right format'
};

const mapDataToForm = data => {
  const { totalCustomDates, totalCustomDateStart, totalCustomDateEnd } = get(data, 'reading', {});

  if (totalCustomDates === true) {
    return {
      totalCustomDates,
      totalCustomDateStart: moment(totalCustomDateStart).format('YYYY-MM-DD'),
      totalCustomDateEnd: moment(totalCustomDateEnd).format('YYYY-MM-DD')
    };
  }
  return { totalCustomDates };
};

const getRadioField = () => fields.radio('totalCustomDates', {
  label: 'What period was used for this volume?',
  subHeading: true,
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
    }]
});

exports.form = (request, data) => setValues({
  ...formFactory(),
  fields: [
    getRadioField(),
    getCsrfTokenField(request),
    getContinueField()
  ]
}, mapDataToForm(data));

const formatLineDateForValidation = date => moment(date, 'YYYY-MM-DD').format('MM-DD-YYYY');

exports.schema = (request, returnData) => {
  const lines = returnData.lines;
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
