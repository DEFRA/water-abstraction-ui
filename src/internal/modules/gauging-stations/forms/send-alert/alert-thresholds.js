const Joi = require('joi')
const { get, uniqBy, capitalize } = require('lodash')
const { formFactory, fields } = require('shared/lib/forms/')
const helpers = require('../../lib/helpers')
const session = require('../../lib/session')

const sendAlertThresholdsForm = request => {
  const f = formFactory(request.path)

  const { licenceGaugingStations } = request.pre
  const { data: licenceGaugingStationsData } = licenceGaugingStations

  const selectedAlertType = get(session.get(request), 'sendingAlertType.value')
  const selectedAlertThresholds = get(session.get(request), 'alertThresholds.value')

  const validOptions = uniqBy(licenceGaugingStationsData.filter(eachLGS => {
    return eachLGS.alertType === selectedAlertType ||
      ['warning', 'resume'].includes(selectedAlertType) ||
      (eachLGS.alertType === 'stop_or_reduce' && selectedAlertType === 'reduce')
  }), v => [v.thresholdValue, v.thresholdUnit].join()).map(n => ({
    thresholdUnit: n.thresholdUnit,
    thresholdValue: n.thresholdValue
  }))

  uniqBy(validOptions, 'thresholdUnit').forEach(eachUnit => f.fields.push(fields.checkbox('alertThresholds', {
    label: `${capitalize(helpers.deduceRestrictionTypeFromUnit(eachUnit.thresholdUnit))} thresholds for this station (${eachUnit.thresholdUnit})`,
    errors: {
      'any.required': {
        message: 'Select applicable threshold(s)'
      },
      'array.min': {
        message: 'Select applicable threshold(s)'
      }
    },
    choices: validOptions.filter(x => x.thresholdUnit === eachUnit.thresholdUnit).map(eachValue => ({
      value: JSON.stringify({ value: eachValue.thresholdValue, unit: eachValue.thresholdUnit }),
      label: `${eachValue.thresholdValue} ${eachValue.thresholdUnit}`
    }))
  }, selectedAlertThresholds)))

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken))
  f.fields.push(fields.button(null, { label: 'Continue' }))
  return f
}

const sendAlertThresholdsSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  alertThresholds: Joi.array().min(1)
})

exports.form = sendAlertThresholdsForm
exports.schema = sendAlertThresholdsSchema
