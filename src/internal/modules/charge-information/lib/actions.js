const { find, omit } = require('lodash');
const moment = require('moment');
const { v4: uuid } = require('uuid');
const DATE_FORMAT = 'YYYY-MM-DD';
const chargeElementMappers = require('./charge-elements/mappers');
const chargeCategoryMappers = require('./charge-categories/mappers');
const { CHARGE_ELEMENT_STEPS } = require('./charge-elements/constants');
const { CHARGE_CATEGORY_STEPS } = require('./charge-categories/constants');
const { srocStartDate } = require('../../../config');
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
  let payload;
  const dates = {
    today: moment().format(DATE_FORMAT),
    licenceStartDate: request.pre.licence.startDate,
    customDate: formValues.customDate
  };
  const scheme = new Date(dates[formValues.startDate]) >= srocStartDate ? 'sroc' : 'alcs';

  // if the charing scheme switches then the restartFlow flag
  // is used to clear the draft charge information and restart the flow from this step onwards
  if (scheme !== request.pre.draftChargeInformation.scheme || request.pre.draftChargeInformation.chargeElements.length === 0) {
    payload = {
      restartFlow: true,
      chargeElements: [],
      changeReason: request.pre.draftChargeInformation.changeReason,
      dateRange: { startDate: dates[formValues.startDate] },
      scheme
    };
  } else {
    payload = {
      ...request.pre.draftChargeInformation,
      dateRange: { startDate: dates[formValues.startDate] }
    };
  }

  return {
    type: ACTION_TYPES.setStartDate,
    payload
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
const getNewChargeElementData = (request, formValues, scheme) => {
  const { defaultCharges } = request.pre;
  const { step } = request.params;
  if (scheme === 'alcs') {
    return chargeElementMappers[step] ? chargeElementMappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token');
  }
  return chargeCategoryMappers[step] ? chargeCategoryMappers[step](formValues, request.payload) : omit(formValues, 'csrf_token');
};

// gets the charge purpose data from the posted form for SROC and omits
// the csrf token to avoid saving this in the draft charge info session cache
const getNewChargePurposeData = (request, formValues) => {
  const { defaultCharges } = request.pre;
  const { step } = request.params;
  return chargeElementMappers[step] ? chargeElementMappers[step](formValues, defaultCharges) : omit(formValues, 'csrf_token');
};

const setChargeElementData = (request, formValues) => {
  const { draftChargeInformation } = request.pre;
  const { elementId, step } = request.params;
  const { returnToCheckData } = request.query;

  const chargeElementToUpdate = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  const data = chargeElementToUpdate
    ? getNewChargeElementData(request, formValues, chargeElementToUpdate.scheme)
    // if the charge element has not been added to the draft charge data then it is an ALCS charge element and we add the scheme
    : getNewChargeElementData(request, formValues, 'alcs');

  if (step === CHARGE_ELEMENT_STEPS.purpose && !returnToCheckData) {
    data.status = 'draft';
  }
  if ((step === CHARGE_ELEMENT_STEPS.loss || step === CHARGE_CATEGORY_STEPS.isAdjustments) && chargeElementToUpdate) {
    delete chargeElementToUpdate.status;
  }
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
    id,
    scheme: 'alcs',
    status: 'draft'
  }
});

const createChargeCategory = (id, chargeElements, chargePurposes, eiucRegion) => ({
  type: ACTION_TYPES.createChargeCategory,
  payload: [
    ...chargeElements,
    {
      id,
      eiucRegion,
      chargePurposes,
      scheme: 'sroc',
      status: 'draft'
    }]
});

const setChargePurposeData = (request, formValues) => {
  const { draftChargeInformation } = request.pre;
  const { categoryId } = request.query;
  const { elementId } = request.params;
  // get rid of the csrf token to avoid saving this in the draft charge info session cache
  const data = getNewChargePurposeData(request, formValues);

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
