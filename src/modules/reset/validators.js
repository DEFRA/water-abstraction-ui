const Joi = require('joi');

module.exports = {
  VALID_EMAIL: {
    REQUEST: Joi.string().allow('').max(254),
    DATA: Joi.string().email().required()
  },
  VALID_FLASH: {
    REQUEST: Joi.string().length(16)
  }
};
