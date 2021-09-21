const Joi = require('joi');
const { get, uniqBy, capitalize } = require('lodash');
const { formFactory, fields } = require('shared/lib/forms/');
const helpers = require('../../lib/helpers');
const session = require('../../lib/session');

const sendAlertThresholdsForm = request => {
  const f = formFactory(request.path);

  const { licenceGaugingStations } = request.pre;
  const { data: licenceGaugingStationsData } = licenceGaugingStations;

  const validOptions = uniqBy(licenceGaugingStationsData, v => [v.thresholdValue, v.thresholdUnit].join()).map(n => ({
    thresholdUnit: n.thresholdUnit,
    thresholdValue: n.thresholdValue
  }));

  const defaultAlertThresholds = get(session.get(request), 'sendingAlertThresholds.value');

  uniqBy(validOptions, 'thresholdUnit').map(eachUnit => f.fields.push(fields.radio('volumeLimited', {
    label: `${capitalize(helpers.deduceRestrictionTypeFromUnit(eachUnit.thresholdUnit))} thresholds for this station (${eachUnit.thresholdUnit})`,
    hint: 'For example, you must not exceed 4000Ml in total from the start of your abstraction period.',
    errors: {
      'any.required': {
        message: 'Select if the licence holder needs to stop abstraction when they reach a certain amount'
      }
    },
    choices: validOptions.filter(x => x.thresholdUnit === eachUnit.thresholdUnit).map(eachValue => ({
      value: eachValue.thresholdValue,
      label: eachValue.thresholdValue
    }))
  })));

  f.fields.push(fields.hidden('csrf_token', {}, request.view.csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));
  return f;
};

const sendAlertThresholdsSchema = () => Joi.object().keys({
  csrf_token: Joi.string().uuid().required(),
  alertType: Joi.string().required().allow('warning', 'stop', 'reduce', 'resume')
});

exports.form = sendAlertThresholdsForm;
exports.schema = sendAlertThresholdsSchema;
