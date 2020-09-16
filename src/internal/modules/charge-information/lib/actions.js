const { find } = require('lodash');
const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  clearData: 'clearData',
  setAbstractionData: 'set.abstractionData',
  setBillingAccount: 'set.billingAccount',
  setReason: 'set.reason',
  setStartDate: 'set.startDate'
};

const setChangeReason = (request, formValues) => {
  const changeReason = formValues.reason === 'non-chargeable'
    ? { changeReasonId: 'non-chargeable' }
    : find(request.pre.changeReasons, { changeReasonId: formValues.reason });

  return {
    type: ACTION_TYPES.setReason,
    payload: changeReason
  };
};

const setStartDate = (request, formValues) => {
  const dates = {
    today: moment().format(DATE_FORMAT),
    licenceStartDate: request.pre.licence.startDate,
    customDate: formValues.customDate
  };

  return {
    type: ACTION_TYPES.setStartDate,
    payload: dates[formValues.startDate]
  };
};

const setBillingAccount = (request, formValues) => {
  const billingAccount = request.pre.billingAccounts.find(account => {
    return account.invoiceAccountAddresses.find(address => {
      return address.id === formValues.invoiceAccountAddress;
    });
  }) || null;

  return {
    type: ACTION_TYPES.setBillingAccount,
    payload: {
      invoiceAccountAddress: formValues.invoiceAccountAddress,
      billingAccount
    }
  };
};

const setAbstractionData = (request, formValues) => {
  const abstractionData = formValues.useAbstractionData
    ? request.pre.defaultCharges
    : false;

  return {
    type: ACTION_TYPES.setAbstractionData,
    payload: abstractionData
  };
};

const clearData = () => {
  return {
    type: ACTION_TYPES.clearData
  };
};

exports.ACTION_TYPES = ACTION_TYPES;

exports.clearData = clearData;
exports.setAbstractionData = setAbstractionData;
exports.setBillingAccount = setBillingAccount;
exports.setChangeReason = setChangeReason;
exports.setStartDate = setStartDate;
