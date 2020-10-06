'use strict';

const querystring = require('querystring');

const createUrl = urlTail => licenceId => {
  return `/licences/${licenceId}/charge-information/${urlTail}`;
};

exports.getChargeElementStep = (licenceId, elementId, step) => {
  return createUrl(`charge-element/${elementId}/${step}`)(licenceId);
};

exports.getSubmitted = (licenceId, isChargeable) => {
  const qs = querystring.stringify({ chargeable: isChargeable });
  return createUrl(`submitted?${qs}`)(licenceId);
};

exports.getCheckData = createUrl('check');
exports.getCreateBillingAccount = createUrl('billing-account/create');
exports.getNonChargeableReason = createUrl('non-chargeable-reason');
exports.getReason = createUrl('create');
exports.getStartDate = createUrl('start-date');
exports.getSelectBillingAccount = createUrl('billing-account');
exports.getUseAbstractionData = createUrl('use-abstraction-data');
exports.getEffectiveDate = createUrl('effective-date');
exports.getNonChargeableReason = createUrl('non-chargeable-reason');
exports.getCancelData = createUrl('cancel');
