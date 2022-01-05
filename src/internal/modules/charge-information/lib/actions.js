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
  setChargeElementData: 'set.chargeElementData',
  setChargeCategoryData: 'set.chargeCategoryData',
  createChargeElement: 'create.chargeElement',
  createChargeCategory: 'create.chargeCategory',
  setChargePurposeData: 'set.chargePurposeData'
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

const setBillingAccount = id => ({
  type: ACTION_TYPES.setBillingAccount,
  payload: {
    billingAccountId: id
  }
});

const generateIds = chargeElements =>
  chargeElements.map(element => ({
    ...element,
    scheme: 'alcs',
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

// gets the charge element data from the posted form and omits the csrf token to
// avoid saving this in the draft charge info session cache
const getNewChargeElementData = (request, formValues) => {
  const { defaultCharges, draftChargeInformation } = request.pre;
  const { step } = request.params;
  return mappers[step] && draftChargeInformation.scheme !== 'sroc' ? mappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token');
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

const createChargeElement = id => ({
  type: ACTION_TYPES.createChargeElement,
  payload: {
    scheme: 'alcs',
    id
  }
});

const createChargeCategory = (id, chargeElements, chargePurposes) => ({
  type: ACTION_TYPES.createChargeCategory,
  payload: [
    ...chargeElements,
    {
      id,
      chargePurposes,
      scheme: 'sroc'
    }]
});

const setChargePurposeData = (request, formValues) => {
  const { draftChargeInformation } = request.pre;
  const { categoryId } = request.query;
  const { elementId } = request.params;
  // get rid of the csrf token to avoid saving this in the draft charge info session cache
  const data = omit(formValues, 'csrf_token');

  const chargeElements = draftChargeInformation.chargeElements
    .map(element => {
      if (element.id === categoryId) {
        element.chargePurposes.map(purpose => {
          if (purpose.id === elementId) {
            return Object.assign(purpose, data);
          }
          return purpose;
        });
      }
      return element;
    });
  return {
    type: ACTION_TYPES.setChargeElementData,
    payload: chargeElements
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
exports.createChargeElement = createChargeElement;
exports.createChargeCategory = createChargeCategory;
exports.setChargePurposeData = setChargePurposeData;
