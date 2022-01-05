'use-strict';

const routing = require('./routing');

const getChargeElementData = request => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;
  const { categoryId } = request.query;
  const chargeElement = categoryId === ''
    ? draftChargeInformation.chargeElements.find(element => element.id === elementId)
    : (draftChargeInformation.chargeElements.find(element => element.id === categoryId))
      .chargePurposes.find(purpose => purpose.id === elementId);
  return chargeElement || {};
};

const getChargeElementActionUrl = (request, step) => {
  const { licenceId, elementId } = request.params;
  return routing.getChargeElementStep(licenceId, elementId, step, request.query);
};

const getChargeCategoryData = request => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  return chargeElement || {};
};

const getChargeCategoryActionUrl = (request, step) => {
  const { licenceId, elementId } = request.params;
  return routing.getChargeCategoryStep(licenceId, elementId, step, request.query);
};

exports.getChargeElementData = getChargeElementData;
exports.getChargeElementActionUrl = getChargeElementActionUrl;

exports.getChargeCategoryData = getChargeCategoryData;
exports.getChargeCategoryActionUrl = getChargeCategoryActionUrl;
