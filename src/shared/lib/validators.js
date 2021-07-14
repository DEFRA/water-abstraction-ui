const Joi = require('joi');
const returnIDRegex = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

module.exports = {

  VALID_GAUGING_STATION: Joi.string(),

  VALID_EMAIL: Joi.string().email().required(),
  VALID_GUID: Joi.string().guid().required(),
  OPTIONAL_GUID: Joi.string().guid(),
  VALID_FLASH: Joi.string().max(16),

  VALID_UTM: {
    utm_source: Joi.string().max(64),
    utm_medium: Joi.string().max(64),
    utm_campaign: Joi.string().max(64)
  },

  VALID_PASSWORD: Joi.string().custom((value, helper) => {
    if (!value.match(/(?=.*[A-Z])/)) {
      return helper.message('must contain an uppercase character');
    }
    if (!value.match(/(?=.*[\W_])/)) {
      return helper.message('must contain a symbol');
    }
    if (value.length < 8) {
      return helper.message('must be at least 8 characters long');
    }
    return value;
  }).required(),
  VALID_CONFIRM_PASSWORD: Joi.string().valid(Joi.ref('password')).required(),

  VALID_LICENCE_QUERY: Joi.object().keys({
    sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
    direction: Joi.number().valid(1, -1).default(1),
    emailAddress: Joi.string().allow('').max(254),
    licenceNumber: Joi.string().allow('').max(32),
    page: Joi.number().allow('').min(1).default(1)
  }),

  VALID_LICENCE_NAME: Joi.string().trim().min(2).max(32).regex(/^[a-z0-9 ']+$/i),

  VALID_RETURN_ID: Joi.string().pattern(returnIDRegex).required()
};
