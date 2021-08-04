'use strict';

const { get } = require('lodash');
const Joi = require('joi');

const { formFactory, fields } = require('shared/lib/forms/');
const routing = require('../lib/routing');

const mapChoice = changeReason => ({
  value: changeReason.id,
  label: changeReason.description
});

const isEnabledReason = changeReason => changeReason.isEnabledForNewChargeVersions;

const getChoices = (changeReasons, isChargeable) => {
  const choices = changeReasons
    .filter(isEnabledReason)
    .map(mapChoice);
  const divider = [{ divider: 'or' }, { label: 'Make this licence non-chargeable', value: 'non-chargeable' }];
  if (isChargeable) {
    choices.push(...divider);
  };
  return choices;
};

/**
 * Select reason for new charge version
 */
const selectReasonForm = (request) => {
  const { csrfToken } = request.view;
  const { changeReasons, licence, draftChargeInformation } = request.pre;
  const { isChargeable, chargeVersionWorkflowId, returnToCheckData } = request.query;

  const action = isChargeable
    ? routing.getReason(licence.id, { chargeVersionWorkflowId, returnToCheckData })
    : routing.getNonChargeableReason(licence.id, { chargeVersionWorkflowId, returnToCheckData });

  const errorMessage = isChargeable
    ? 'Select a reason for new charge information' : 'Select a reason';

  const changeReasonId = get(draftChargeInformation, 'changeReason.id');

  const f = formFactory(action, 'POST');

  f.fields.push(fields.radio('reason', {
    errors: {
      'any.required': {
        message: errorMessage
      }
    },
    choices: getChoices(changeReasons, isChargeable)
  }, changeReasonId));

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: 'Continue' }));

  return f;
};

const selectReasonSchema = (request) => {
  const { changeReasons } = request.pre;
  const { isChargeable } = request.query;
  const validReasons = changeReasons.map(changeReason => changeReason.id);
  if (isChargeable) {
    validReasons.push('non-chargeable');
  };

  return Joi.object({
    csrf_token: Joi.string().uuid().required(),
    reason: Joi.string().required().valid(...validReasons)
  });
};

exports.form = selectReasonForm;
exports.schema = selectReasonSchema;
