'use strict';

const { formFactory, fields } = require('shared/lib/forms/');
const { get } = require('lodash');
const routing = require('../lib/routing');

const deleteChargeInformationForm = (request, isCancelData = true) => {
  const { csrfToken } = request.view;
  const chargeVersionWorkflowId = get(request, 'query.chargeVersionWorkflowId', null);

  const action = isCancelData
    ? routing.getCancelData(request.params.licenceId, chargeVersionWorkflowId ? { chargeVersionWorkflowId } : null)
    : `/charge-information-workflow/${request.params.chargeVersionWorkflowId}/remove`;
  const f = formFactory(action, 'POST');

  const buttonLabel = isCancelData ? 'Cancel' : 'Remove';

  f.fields.push(fields.hidden('csrf_token', {}, csrfToken));
  f.fields.push(fields.button(null, { label: buttonLabel }));

  return f;
};

exports.form = deleteChargeInformationForm;
