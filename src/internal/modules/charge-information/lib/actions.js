const { find, omit } = require('lodash');
const moment = require('moment');
const uuid = require('uuid/v4');
const DATE_FORMAT = 'YYYY-MM-DD';
const mappers = require('./charge-elements/mappers');

const ACTION_TYPES = {
  clearData: 'clearData',
  setBillingAccount: 'set.invoiceAccount',
  setReason: 'set.reason',
  setStartDate: 'set.startDate',
  setChargeElementData: 'set.chargeElementData'
};

const setChangeReason = (request, formValues) => {
  if (formValues.reason === 'non-chargeable') {
    return {
      type: ACTION_TYPES.clearData
    };
  }
  return {
    type: ACTION_TYPES.setReason,
    payload: find(request.pre.changeReasons, { id: formValues.reason })
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
  const invoiceAccount = request.pre.billingAccounts.find(account => {
    return account.invoiceAccountAddresses.find(address => {
      return address.id === formValues.invoiceAccountAddress;
    });
  }) || { invoiceAccount: null };

  return {
    type: ACTION_TYPES.setBillingAccount,
    payload: {
      ...(invoiceAccount && invoiceAccount) || null,
      invoiceAccountAddress: formValues.invoiceAccountAddress
    }
  };
};

const generateIds = chargeElements =>
  chargeElements.map(element => ({
    ...element,
    id: uuid()
  }));

const setAbstractionData = (request, formValues) => {
  let chargeElements = [];
  if (formValues.useAbstractionData === 'yes') {
    chargeElements = generateIds(request.pre.defaultCharges);
  } else if (formValues.useAbstractionData !== 'no') {
    const chargeVersion = request.pre.chargeVersions.find(cv => cv.id === formValues.useAbstractionData);
    chargeElements = generateIds(chargeVersion.chargeElements);
  }
  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: chargeElements
  };
};

const getNewChargeElementData = (request, formValues) => {
  const { defaultCharges } = request.pre;
  const { step } = request.params;
  return mappers[step] ? mappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token');
};

const setChargeElementData = (request, formValues) => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;

  const data = getNewChargeElementData(request, formValues);
  const chargeElementToUpdate = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  chargeElementToUpdate
    ? Object.assign(chargeElementToUpdate, data)
    : draftChargeInformation.chargeElements.push({ ...data, id: elementId });

  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: draftChargeInformation.chargeElements
  };
};

const removeChargeElement = request => {
  const { draftChargeInformation: { chargeElements } } = request.pre;
  const { buttonAction } = request.payload;
  const [, chargeElementId] = buttonAction.split(':');
  const updatedChargeElements = chargeElements.filter(element => element.id !== chargeElementId);

  return {
    type: ACTION_TYPES.setChargeElementData,
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
exports.setChargeElementData = setChargeElementData;
exports.removeChargeElement = removeChargeElement;
