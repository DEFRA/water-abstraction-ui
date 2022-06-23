const { getChargeCategoryData, getChargeCategoryActionUrl } = require('../../lib/form-helpers')
const { ROUTING_CONFIG } = require('../../lib/charge-categories/constants')
const Joi = require('joi')
const { groupBy } = require('lodash')
const { formFactory, fields } = require('shared/lib/forms/')

const getChoices = (config, supportedSources) => {
  const optionsByRegion = Object.fromEntries(Object.entries(groupBy(supportedSources, 'region')).sort())
  const flattenedOptions = Object.values(optionsByRegion)

  const choices = []
  flattenedOptions.forEach(region => {
    choices.push({ divider: region[0].region })
    region.forEach(source => choices.push({ value: source.id, label: source.name }))
  })

  return {
    errors: {
      'any.required': {
        message: config.errorMessage
      }
    },
    classes: 'radios-dividers-bold',
    choices
  }
}

/**
 * Form to request the supported source names
 *
 * @param {Object} request The Hapi request object
 * @returns {Object} object containing selected and default options for the form
 */
const form = request => {
  const { csrfToken } = request.view
  const data = getChargeCategoryData(request)
  const { supportedSources } = request.pre

  const action = getChargeCategoryActionUrl(request, ROUTING_CONFIG.supportedSourceName.step)

  const f = formFactory(action, 'POST')

  f.fields.push(fields.radio('supportedSourceId', getChoices(ROUTING_CONFIG.supportedSourceName, supportedSources), data.supportedSourceId || ''))
  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const schema = Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  supportedSourceId: Joi.string().uuid().required()
})

exports.schema = schema

exports.form = form
