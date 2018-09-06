const Joi = require('joi');
const moment = require('moment');
const { formFactory, fields, setValues } = require('../../../lib/forms');
const { getFormLines } = require('../lib/return-helpers');
const { maxPrecision } = require('../../../lib/number-formatter');

/**
 * Gets label text for line
 * @param {Object} line from requiredLines array
 * @return {String} label
 */
const getLabel = (line) => {
  if (line.timePeriod === 'day') {
    return moment(line.startDate).format('D MMMM');
  }
  if (line.timePeriod === 'week') {
    return 'Week ending ' + moment(line.endDate).format('D MMMM');
  }
  if (line.timePeriod === 'month') {
    return moment(line.startDate).format('MMMM');
  }
  if (line.timePeriod === 'year') {
    return moment(line.startDate).format('D MMMM YYYY - ') + moment(line.endDate).format('D MMMM YYYY');
  }
};

/**
 * Get form field name
 * @param {Object} line
 * @return {String} field name
 */
const getName = (line) => {
  return line.startDate + '_' + line.endDate;
};

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

const getLineValues = (lines) => {
  return lines.reduce((acc, line) => {
    const name = getName(line);
    return {
      ...acc,
      [name]: maxPrecision(line.quantity, 3)
    };
  }, {});
};

const quantitiesForm = (request, data) => {
  const { csrfToken } = request.view;

  const f = formFactory(`/admin/return/quantities`);

  const suffix = getSuffix(data.reading.units);

  const lines = getFormLines(data);

  for (let line of lines) {
    const name = getName(line);
    const label = getLabel(line);
    f.fields.push(fields.text(name, { label, suffix }));
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
    const name = getName(line);
    return {
      ...acc,
      [name]: Joi.number().allow('')
    };
  }, schema);
};

module.exports = {
  quantitiesForm,
  quantitiesSchema
};
