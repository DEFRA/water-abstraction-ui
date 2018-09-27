const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getMeter, getFormLines, getLineName, getLineLabel } = require('../lib/return-helpers');
const { get } = require('lodash');

const getLineTextInput = line => {
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
        message: 'Reading must be equal to or greater than the previous reading'
      },
      'number.startReading': {
        message: 'Reading must be equal to or greater than the start reading'
      }
    }
  });
};

const form = (request, data) => {
  const { csrfToken } = request.view;

  const isInternal = request.permissions.hasPermission('admin.defra');
  const action = `${isInternal ? '/admin' : ''}/return/meter/readings`;

  const f = formFactory(action);

  const lines = getFormLines(data);

  // add a text field for each required meter reading
  lines.forEach(line => f.fields.push(getLineTextInput(line)));

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const readings = getMeter(data).readings || {};
  return setValues(f, readings);
};

const getMeterStartReadingValidator = startReading => {
  return Joi.number().allow(null).min(startReading).error(() => {
    return { type: 'number.startReading' };
  });
};

/**
 * Creates a validator for the line at the given index.
 *
 * The lines are in date order so the first validator only
 * validates that the value is either empty or, greater than or equal
 * to the meter start reading.
 *
 * For all the rest of the lines, the value is validated to ensure
 * that the value is null, or greater than or equal to the previous
 * readings and the meter start reading.
 */
const getReadingValidator = (startReading, lines, index) => {
  const startReadingMin = getMeterStartReadingValidator(startReading);

  if (index === 0) {
    return startReadingMin;
  }

  let validator = Joi.number().allow(null);

  // get the preceeding lines
  lines.slice(0, index).forEach(line => {
    const name = getLineName(line);
    validator = validator.when(name, {
      // If the target value is entered and is numeric
      is: Joi.number().strict().required(),

      // ensure this value is at the same the value
      then: Joi.number().allow(null).min(Joi.ref(name)),

      // if the target value is null, then just validate against
      // the meter start reading.
      otherwise: startReadingMin
    });
  });

  return validator;
};

const schema = (data) => {
  let schema = {
    csrf_token: Joi.string().guid().required()
  };

  const lines = getFormLines(data);
  const startReading = get(data, 'meters[0].startReading', 0);

  schema = lines.reduce((acc, line, currentIndex) => {
    const name = getLineName(line);
    const obj = {
      ...acc,
      [name]: getReadingValidator(startReading, lines, currentIndex)
    };
    return obj;
  }, schema);

  return schema;
};

module.exports = {
  meterReadingsForm: form,
  meterReadingsSchema: schema
};
