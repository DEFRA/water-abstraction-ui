'use strict';

const queryString = require('querystring');

const createUrl = urlTail => licenceId => {
  return `/licences/${licenceId}/charge-information/${urlTail}`;
};

exports.getChargeElementStep = (licenceId, elementId, step) => {
  return createUrl(`charge-element/${elementId}/${step}`)(licenceId);
};

exports.getSubmitted = (licenceId, isChargeable) => {
  const qs = queryString.stringify({ chargeable: isChargeable });
  return createUrl(`submitted?${qs}`)(licenceId);
};

exports.getCreateBillingAccount = (licence, licenceHolderRole, redirect) => {
  const { id, region } = licence;
  const qs = queryString.stringify({
    redirectPath: createUrl(redirect)(id),
    licenceId: id });
  return `/invoice-accounts/create/${region.id}/${licenceHolderRole.company.id}?${qs}`;
};

exports.postReview = (request) => {
  return `/licences/${request.params.licenceId}/charge-information/${request.params.chargeVersionWorkflowId}/review`;
};

exports.getCheckData = createUrl('check');
exports.getReason = createUrl('create');
exports.getStartDate = createUrl('start-date');
exports.getSelectBillingAccount = createUrl('billing-account');
exports.getUseAbstractionData = createUrl('use-abstraction-data');
exports.getEffectiveDate = createUrl('effective-date');
exports.getNonChargeableReason = createUrl('non-chargeable-reason');
exports.getCancelData = createUrl('cancel');
