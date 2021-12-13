'use-strict';

const routing = require('./routing');

const getChargeElementData = request => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  return chargeElement || {};
};

const getChargeElementActionUrl = (request, step) => {
  const { licenceId, elementId } = request.params;
  return routing.getChargeElementStep(licenceId, elementId, step, request.query);
};

const getChargeCategoryData = request => {
  const { draftChargeInformation } = request.pre;
  const { categoryId } = request.params;
  const chargeCategory = draftChargeInformation.chargeCategories.find(category => category.id === categoryId);
  return chargeCategory || {};
};

const getChargeCategoryActionUrl = (request, step) => {
  const { licenceId, categoryId } = request.params;
  return routing.getChargeCategoryStep(licenceId, categoryId, step, request.query);
};

exports.getChargeElementData = getChargeElementData;
exports.getChargeElementActionUrl = getChargeElementActionUrl;

exports.getChargeCategoryData = getChargeCategoryData;
exports.getChargeCategoryActionUrl = getChargeCategoryActionUrl;
