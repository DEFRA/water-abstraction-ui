'use strict';

const isCurrentAddress = accountAddress =>
  accountAddress.dateRange.endDate === null;

/**
 * Gets the current billing account address
 * @param {Object} billingAccount
 * @returns {Object}
 */
const getCurrentAddress = billingAccount =>
  billingAccount.invoiceAccountAddresses.find(isCurrentAddress);

exports.getCurrentAddress = getCurrentAddress;
