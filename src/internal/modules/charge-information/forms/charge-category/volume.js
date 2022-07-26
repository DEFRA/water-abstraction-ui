'use strict'

const Joi = require('joi')
const { formFactory, fields } = require('shared/lib/forms/')
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants')
const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers')

/**
 * Form to request the abstraction quantities
 *
 * @param {Object} request The Hapi request object
 */
const form = request => {
  const { csrfToken } = request.view
  const data = getChargeCategoryData(request)
  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.volume.step)

  const f = formFactory(action, 'POST')
  f.fields.push(fields.text('volume', {
    controlClass: 'govuk-input govuk-input--width-10',
    suffix: 'ML',
    errors: {
      'number.base': {
        message: 'Enter the volume in ML (megalitres).'
      },
      'number.positive': {
        message: 'The volume must be equal to or greater than 0'
      },
      'number.min': {
        message: 'The volume must be equal to or greater than 0'
      },
      'number.max': {
        message: 'The volume must be equal to or less than 1,000,000,000,000,000'
      },
      'number.unsafe': {
        message: 'Enter a number that is less than 1,000,000,000,000,000 or fewer than 17 digits long'
      },
      'number.custom': {
        message: 'Enter a number with no more than 6 decimal places. For example, 20.123456'
      }

    }
  }, data.volume || ''))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const schema = () => {
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    volume: Joi
      .number().required().greater(0).max(1000000000000000)
      .custom((value, helper) => {
        const { error, original } = helper
        const [, decimals = ''] = original.split('.')
        if (original.length > 16) {
          return error('number.unsafe')
        }
        if (decimals.length > 6) {
          return error('number.custom')
        }
        return value
      })
  })
}
exports.schema = schema
exports.form = form
