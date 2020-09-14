exports.getCheckData = licence => `/licences/${licence.id}/charge-information/check`;
exports.getCreateBillingAccount = licence => `/licences/${licence.id}/charge-information/billing-account/create`;
exports.getNonChargeableReason = licence => `/licences/${licence.id}/charge-information/non-chargeable-reason`;
exports.getReason = licence => `/licences/${licence.id}/charge-information/create`;
exports.getStartDate = licence => `/licences/${licence.id}/charge-information/start-date`;
exports.getSelectBillingAccount = licence => `/licences/${licence.id}/charge-information/billing-account`;
exports.getUseAbstractionData = licence => `/licences/${licence.id}/charge-information/use-abstraction-data`;
