'use strict'

const { get } = require('lodash')
const Joi = require('joi')
const moment = require('moment')

const { formFactory, fields } = require('shared/lib/forms/')
const routing = require('../lib/routing')

const getAddionalChoices = (chargeVersions) => {
  if (chargeVersions.length > 0) {
    const choices = [{ divider: 'or' }]
    chargeVersions.forEach(cv => {
      choices.push(
        {
          value: cv.id,
          label: `Use charge information valid from ${moment(cv.dateRange.startDate).format('D MMMM YYYY')}`
        })
    })
    return choices
  }
  return []
}

const filterChargeVersions = (chargeVersions, scheme) => chargeVersions.filter(cv => cv.status === 'current' && (scheme === 'sroc' || scheme === cv.scheme))

const useAbstractionDataForm = request => {
  const { csrfToken } = request.view
  const { chargeVersionWorkflowId } = request.query
  const { licence, draftChargeInformation, chargeVersions } = request.pre
  const useAbstractionData = get(draftChargeInformation, 'abstractionData')
  const filteredChargeVersions = filterChargeVersions(chargeVersions, draftChargeInformation.scheme)
  const choices = [
    { value: 'yes', label: 'Yes' },
    { value: 'no', label: 'No' },
    ...getAddionalChoices(filteredChargeVersions)
  ]

  const action = routing.getUseAbstractionData(licence.id, { chargeVersionWorkflowId })

  const f = formFactory(action, 'POST')

  f.fields.push(fields.radio('useAbstractionData', {
    errors: {
      'any.required': {
        message: 'Select whether to use abstraction data to set up the element'
      }
    },
    choices
  }, useAbstractionData))

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))

  return f
}

const useAbstractionDataSchema = (request) => {
  const { chargeVersions, draftChargeInformation } = request.pre
  const validIds = filterChargeVersions(chargeVersions, draftChargeInformation.scheme).map(cv => cv.id)
  return Joi.object().keys({
    csrf_token: Joi.string().uuid().required(),
    useAbstractionData: Joi.string().valid(...['yes', 'no', ...validIds]).required()
  })
}

exports.form = useAbstractionDataForm
exports.schema = useAbstractionDataSchema
