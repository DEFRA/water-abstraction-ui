const Joi = require('@hapi/joi');

module.exports.flowConverter = (value, unit = 'litre', period = 'second') => {
  let val = value;

  // Validate
  Joi.assert({ unit, period }, {
    unit: Joi.string().valid('cm', 'litre', 'megalitre'),
    period: Joi.string().valid('second', 'day')
  });

  if (unit === 'litre') {
    val = val * 1000;
  }
  if (unit === 'megalitre') {
    val = val / 1000;
  }
  if (period === 'day') {
    val = val * 86400;
  }

  return parseFloat(val).toFixed(1);
};
