'use strict'

const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants')
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers')

/**
 * Form to request the charge category description
 *
 * @param {Object} request The Hapi request object
 * @member {Object} data object containing selected and default options for the form
  */
const form = request => {
  const { csrfToken } = request.view
  const data = getChargeCategoryData(request)
  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.description.step)

  const f = formFactory(action, 'POST')
  f.fields.push(fields.text('description', {
    hint: 'This is the description that will appear on the invoice. You can use letters, numbers, hyphens, ampersands, brackets, semi colons and apostrophes.',
    errors: {
      'string.empty': {
        message: 'Enter a description for the charge reference'
      },
      'any.required': {
        message: 'Enter a description for the charge reference'
      },
      'string.pattern.invert.base': {
        message: 'You can not use “ ” ? ^ £ ≥ ≤ — (long dash) in the charge reference description'
      },
      'string.max': {
        message: 'The description for the charge reference must be 180 characters or less'
      }
    }
  }, data.description || ''))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const schema = () => {
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    description: Joi.string().pattern(/[“”?^£≥≤—]/, { invert: true }).max(180).required()
  })
}

exports.schema = schema

exports.form = form
