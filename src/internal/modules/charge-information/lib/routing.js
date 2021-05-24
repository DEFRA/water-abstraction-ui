'use strict';

const queryString = require('querystring');
const { isEmpty } = require('lodash');
const cleanObject = require('./clean-object');

const createUrl = urlTail => (licenceId, queryParams = null) => {
  const url = `/licences/${licenceId}/charge-information/${urlTail}`;
  const qp = cleanObject(queryParams);
  return isEmpty(qp) ? url : `${url}?${queryString.stringify(qp)}`;
};

exports.getChargeElementStep = (licenceId, elementId, step, queryParams) => createUrl(`charge-element/${elementId}/${step}`)(licenceId, queryParams);

exports.postReview = (chargeVersionWorkflowId, licenceId) => createUrl(`${chargeVersionWorkflowId}/review`)(licenceId);
exports.getReview = (chargeVersionWorkflowId, licenceId) => createUrl(`${chargeVersionWorkflowId}/review`)(licenceId);

exports.getHandleBillingAccount = createUrl('set-billing-account');
exports.getSubmitted = createUrl('submitted');
exports.getCheckData = createUrl('check');
exports.getReason = createUrl('create');
exports.getStartDate = createUrl('start-date');
exports.getSelectBillingAccount = createUrl('billing-account');
exports.getUseAbstractionData = createUrl('use-abstraction-data');
exports.getEffectiveDate = createUrl('effective-date');
exports.getNonChargeableReason = createUrl('non-chargeable-reason');
exports.getCancelData = createUrl('cancel');
