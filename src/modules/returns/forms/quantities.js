const Joi = require('joi');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getFormLines, getLineLabel, getLineName, getLineValues } = require('../lib/return-helpers');
const { STEP_QUANTITIES, getPath } = require('../lib/flow-helpers');

/**
 * Get field suffix - this is the units used for this return
 * @param {String} unit - internal SI unit or gal
 * @return {String} suffix - human readable unit
 */
const getSuffix = (unit) => {
  const u = unit.replace('³', '3');
  const units = {
    m3: 'cubic metres',
    l: 'litres',
    gal: 'gallons',
    Ml: 'megalitres'
  };
  return units[u];
};

const quantitiesForm = (request, data) => {
  const { csrfToken } = request.view;

  const action = getPath(STEP_QUANTITIES, request);

  const f = formFactory(action);

  const suffix = getSuffix(data.reading.units);

  const lines = getFormLines(data);

  for (let line of lines) {
    const name = getLineName(line);
    const label = getLineLabel(line);
    f.fields.push(fields.text(name, {
      label,
      autoComplete: false,
      suffix,
      mapper: 'numberMapper',
      type: 'number',
      controlClass: 'form-control form-control--small',
      errors: {
        'number.base': {
          message: 'Enter an amount in numbers'
        },
        'number.min': {
          message: 'Enter an amount of 0 or above'
        }
      }
    }));
  }

  f.fields.push(fields.button());
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));

  const values = getLineValues(data.lines);

  return setValues(f, values);
};

/**
 * Get Joi schema for quantities form
 * @param {Object} data model for return
 * @return Joi schema
 */
const quantitiesSchema = (data) => {
  const schema = {
    csrf_token: Joi.string().guid().required()
  };

  const lines = getFormLines(data);

  return lines.reduce((acc, line) => {
    const name = getLineName(line);
    return {
      ...acc,
      [name]: Joi.number().allow(null).min(0)
    };
  }, schema);
};

module.exports = {
  quantitiesForm,
  quantitiesSchema
};
