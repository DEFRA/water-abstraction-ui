const Joi = require('@hapi/joi');

exports.VALID_DATE = Joi.string().isoDate();
exports.VALID_PERIOD = Joi.string().valid(['day', 'week', 'month', 'year']);
exports.VALID_QUANTITY = Joi.number().allow(null);
exports.VALID_READING_TYPE = Joi.string().valid(['estimated', 'measured']);
exports.VALID_FLAG = Joi.boolean();

const VALID_MONTH = Joi.number().required().min(1).max(12);
const VALID_DAY = Joi.number().required().min(1).max(31);

exports.VALID_ABSTRACTION_PERIOD = {
  periodEndDay: VALID_DAY,
  periodEndMonth: VALID_MONTH,
  periodStartDay: VALID_DAY,
  periodStartMonth: VALID_MONTH
};
