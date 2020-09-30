const { find } = require('lodash');
const moment = require('moment');
const uuid = require('uuid/v4');
const DATE_FORMAT = 'YYYY-MM-DD';

const ACTION_TYPES = {
  clearData: 'clearData',
  setAbstractionData: 'set.abstractionData',
  setBillingAccount: 'set.invoiceAccount',
  setReason: 'set.reason',
  setStartDate: 'set.startDate',
  removeChargeElement: 'remove.chargeElement'
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
  let invoiceAccountAddress;
  const invoiceAccount = request.pre.billingAccounts.find(account => {
    invoiceAccountAddress = account.invoiceAccountAddresses.find(address => {
      return address.id === formValues.invoiceAccountAddress;
    });
    return invoiceAccountAddress;
  }) || null;

  return {
    type: ACTION_TYPES.setBillingAccount,
    payload: {
      ...invoiceAccount,
      invoiceAccountAddress
    }
  };
};

const generateIds = chargeElements =>
  chargeElements.map(element => ({
    ...element,
    id: uuid()
  }));

const setAbstractionData = (request, formValues) => {
  const abstractionData = formValues.useAbstractionData
    ? generateIds(request.pre.defaultCharges)
    : [];

  return {
    type: ACTION_TYPES.setAbstractionData,
    payload: abstractionData
  };
};

const removeChargeElement = request => {
  const { draftChargeInformation: { chargeElements } } = request.pre;
  const { buttonAction } = request.payload;
  const [, chargeElementId] = buttonAction.split(':');
  const updatedChargeElements = chargeElements.filter(element => element.id !== chargeElementId);

  return {
    type: ACTION_TYPES.removeChargeElement,
    payload: updatedChargeElements
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
exports.removeChargeElement = removeChargeElement;
