const Joi = require('joi');

exports.VALID_DATE = Joi.string().isoDate();
exports.VALID_PERIOD = Joi.string().valid(['day', 'week', 'month', 'year']);
exports.VALID_QUANTITY = Joi.number().allow(null);
exports.VALID_READING_TYPE = Joi.string().valid(['estimated', 'measured']);
