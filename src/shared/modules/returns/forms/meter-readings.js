const Joi = require('@hapi/joi');
const { get } = require('lodash');
const { fields, importData } = require('shared/lib/forms');
const { getLineName, getLineLabel, getFormLines } = require('./common');

const getStartReadingField = label => {
  return fields.text('startReading', {
    label,
    autoComplete: false,
    attr: {
      autofocus: true
    },
    mapper: 'numberMapper',
    type: 'number',
    controlClass: 'input--meter-reading',
    errors: {
      'number.base': { message: 'Enter a meter start reading' },
      'any.required': { message: 'Enter a meter start reading' },
      'number.positive': { message: 'This number should be positive' }
    }
  });
};

const getLineField = (line, suffix) => {
  const name = getLineName(line);
  const label = getLineLabel(line);
  return fields.text(name, {
    label,
    autoComplete: false,
    mapper: 'numberMapper',
    type: 'number',
    controlClass: 'input--meter-reading',
    errors: {
      'number.min': {
        message: 'Each meter reading should be higher than or equal to the last'
      },
      'number.startReading': {
        message: 'Reading should be higher than or equal to the start reading'
      },
      'number.lastReading': {
        message: 'Each meter reading should be higher than or equal to the last'
      }
    }
  });
};

const getLineFields = data => getFormLines(data).map(getLineField);

const getStartReading = data => get(data, 'startReading', 0) || 0;

const getMeterReadingValidator = (type, minValue) => {
  return Joi
    .number()
    .allow(null)
    .min(minValue)
    .error(() => ({ type }));
};

const getStartReadingValidator = data => getMeterReadingValidator(
  'number.startReading',
  getStartReading(data)
);

const getRecentReadingValidator = getMeterReadingValidator.bind(
  null, 'number.lastReading'
);

/**
 * The schema for the meter readings is created dynamically
 * based on the actual data submitted to facilitate the validation
 * of the meter readings which follow these rules
 *
 *  - can be null (empty)
 *  - must be greater than or equal to the start meter reading
 *  - must be greater that any earlier readings
 *
 * @param {object} data The returns model
 * @param {object} form The form object
 */
const schema = (request, data, form) => {
  const internalData = importData(form, request.payload);

  const baseSchema = {
    csrf_token: Joi.string().guid().required(),
    startReading: Joi.number().positive().allow(0).required()
  };

  const lines = getFormLines(data);
  const startValidator = getStartReadingValidator(internalData);
  let lastReading = false;

  return lines.reduce((acc, line, currentIndex) => {
    const name = getLineName(line);
    const validator = (currentIndex === 0 || lastReading === false)
      ? startValidator
      : startValidator.concat(getRecentReadingValidator(lastReading));

    if (internalData[name] !== null) {
      // This line has data, keep track for future validations.
      lastReading = internalData[name];
    }
    return { ...acc, [name]: validator };
  }, baseSchema);
};

exports.getStartReadingField = getStartReadingField;
exports.getLineField = getLineField;
exports.getLineFields = getLineFields;
exports.schema = schema;
