const Joi = require('joi');
const { get } = require('lodash');
const { fields } = require('shared/lib/forms');
const { getLineName, getLineLabel } = require('./common');
const { maxPrecision } = require('shared/lib/number-formatter');

/**
 * Returns form lines
 * @param {Object} returns data model
 * @return {Array} returns lines if set and not empty, otherwise required lines
 */
const getFormLines = data =>
  get(data, 'lines.length') > 0 ? data.lines : data.requiredLines;

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

const getLineField = (line, suffix, isFirstLine) => {
  const name = getLineName(line);

  return fields.text(name, {
    label: getLineLabel(line),
    autoComplete: false,
    suffix,
    attr: {
      autofocus: isFirstLine || undefined
    },
    mapper: 'numberMapper',
    type: 'number',
    controlClass: 'govuk-!-width-one-quarter',
    errors: {
      'number.base': {
        message: 'Enter an amount in numbers'
      },
      'number.min': {
        message: 'Enter an amount of 0 or above'
      }
    }
  });
};

const getLineFields = data => {
  const suffix = getSuffix(data.reading.units);
  const lines = getFormLines(data);
  return lines.map((line, index) => {
    return getLineField(line, suffix, index === 0);
  });
};

const getLineValues = (lines) => {
  return lines.reduce((acc, line) => {
    const name = getLineName(line);
    return {
      ...acc,
      [name]: maxPrecision(line.quantity, 3)
    };
  }, {});
};

const quantitiesSchema = (request, data) => {
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

exports.getLineFields = getLineFields;
exports.getLineValues = getLineValues;
exports.schema = quantitiesSchema;
