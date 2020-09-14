'use strict';

const querystring = require('querystring');

const createUrl = urlTail => licence => {
  return `/licences/${licence.id}/charge-information/${urlTail}`;
};

exports.getCheckData = createUrl('check');

exports.getConfirm = (licence, isChargeable) => {
  const qs = querystring.stringify({ chargeable: isChargeable });
  return `/licences/${licence.id}/charge-information/confirm?${qs}`;
};

exports.getCreateBillingAccount = createUrl('billing-account/create');
exports.getEffectiveDate = createUrl('effective-date');
exports.getNonChargeableReason = createUrl('non-chargeable-reason');
exports.getReason = createUrl('create');
exports.getStartDate = createUrl('start-date');
exports.getSelectBillingAccount = createUrl('billing-account');
exports.getUseAbstractionData = createUrl('use-abstraction-data');
