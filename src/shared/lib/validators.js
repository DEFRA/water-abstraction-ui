'use strict'

const Joi = require('joi')

const returnIDRegex = /^v1:[1-8]:[^:]+:[0-9]+:[0-9]{4}-[0-9]{2}-[0-9]{2}:[0-9]{4}-[0-9]{2}-[0-9]{2}$/

const joiPasswordValidator = Joi.extend(joi => {
  return {
    type: 'passwordValidation',
    base: joi.string(),
    messages: {
      'password.uppercase': 'must contain an uppercase character',
      'password.symbol': 'must contain a symbol',
      'password.min': 'must contain at least 8 characters',
      'password.empty': 'must not be blank',
      'password.undefined': 'must not be blank',
      'password.required': 'must not be blank'
    },
    validate: (value, helpers) => {
      const hasUpperCase = /(?=.*[A-Z])/.test(value)
      const hasSymbol = /^.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?].*$/.test(value)
      const errors = []

      if (!value) {
        return { value, errors: helpers.error('password.required') }
      }
      if (!hasUpperCase) {
        errors.push(helpers.error('password.uppercase'))
      }
      if (!hasSymbol) {
        errors.push(helpers.error('password.symbol'))
      }

      if (value.length < 8) {
        errors.push(helpers.error('password.min'))
      }

      if (errors.length === 0) {
        return { value }
      } else {
        return { value, errors }
      }
    }
  }
})

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

  VALID_PASSWORD: joiPasswordValidator.passwordValidation(),

  VALID_CONFIRM_PASSWORD: Joi.string().valid(Joi.ref('password')),

  VALID_LICENCE_QUERY: Joi.object().keys({
    sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
    direction: Joi.number().valid(1, -1).default(1),
    emailAddress: Joi.string().allow('').max(254),
    licenceNumber: Joi.string().allow('').max(32),
    page: Joi.number().allow('').min(1).default(1)
  }),

  VALID_LICENCE_NAME: Joi.string().trim().min(2).max(32).regex(/^[a-z0-9 ']+$/i),

  VALID_RETURN_ID: Joi.string().pattern(returnIDRegex).required()
}
