const BaseJoi = require('joi');
const joiPasswordValidator = require('./joi-password-validator');
const Joi = BaseJoi.extend(joiPasswordValidator);

module.exports = {

  VALID_EMAIL: Joi.string().email().required(),
  VALID_GUID: Joi.string().guid().required(),
  OPTIONAL_GUID: Joi.string().guid(),
  VALID_FLASH: Joi.string().max(16),

  VALID_UTM: {
    utm_source: Joi.string().max(16),
    utm_medium: Joi.string().max(16),
    utm_campaign: Joi.string().max(16)
  },

  VALID_PASSWORD: Joi.string().requireUppercase().requireSymbol().min(8).max(128).required(),
  VALID_CONFIRM_PASSWORD: Joi.string().valid(Joi.ref('password')).required()
};
