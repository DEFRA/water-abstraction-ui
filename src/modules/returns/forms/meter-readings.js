const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter, getFormLines, getLineName, getLineLabel } = require('../lib/return-helpers');
const { get, set } = require('lodash');
const { STEP_METER_READINGS, getPath } = require('../lib/flow-helpers');

const getStartReadingInput = () => {
  return fields.text('startReading', {
    label: 'Start reading (before you began abstracting in this period)',
    autoComplete: false,
    mapper: 'numberMapper',
    type: 'number',
    controlClass: 'form-control form-control--reading',
    errors: {
      'number.base': { message: 'Enter a meter start reading' },
      'any.required': { message: 'Enter a meter start reading' },
      'number.positive': { message: 'This number should be positive' }
    }
  });
};

const getLineTextInput = (line, suffix) => {
  const name = getLineName(line);
  const label = getLineLabel(line);
  return fields.text(name, {
    label,
    autoComplete: false,
    mapper: 'numberMapper',
    type: 'number',
    controlClass: 'form-control form-control--reading',
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

const form = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_METER_READINGS, request);

  const f = formFactory(action);
  f.fields.push(fields.paragraph(null, {
    text: 'Enter your readings exactly as they appear on your meter.'
  }));

  f.fields.push(getStartReadingInput());

  const lines = getFormLines(data);

  // add a text field for each required meter reading
  lines.forEach(line => f.fields.push(getLineTextInput(line)));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const readings = getMeter(data).readings || {};
  set(readings, 'startReading', get(data, 'meters[0].startReading'));
  return setValues(f, readings);
};

const getStartReading = data => get(data, 'startReading', 0) || 0;

const getMeterReadingValidator = (type, minValue) => Joi
  .number()
  .allow(null)
  .min(minValue)
  .error(() => ({ type }));

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
 * @param {object} internalData The request payload after all internal
 * mappers are applied.
 */
const schema = (data, internalData) => {
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

module.exports = {
  meterReadingsForm: form,
  meterReadingsSchema: schema
};
