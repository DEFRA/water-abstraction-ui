const BaseJoi = require('joi');
const joiPasswordValidator = require('./joi-password-validator');
const Joi = BaseJoi.extend(joiPasswordValidator);

module.exports = {

  VALID_GAUGING_STATION: Joi.string(),

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
  VALID_CONFIRM_PASSWORD: Joi.string().valid(Joi.ref('password')).required(),

  VALID_LICENCE_QUERY: {
    sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
    direction: Joi.number().valid(1, -1).default(1),
    emailAddress: Joi.string().allow('').max(254),
    licenceNumber: Joi.string().allow('').max(32),
    page: Joi.number().allow('').min(1).default(1)
  },

  VALID_LICENCE_NAME: Joi.string().trim().min(2).max(32).regex(/^[a-z0-9 ']+$/i)
};
