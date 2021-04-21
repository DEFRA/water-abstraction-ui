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

exports.getChargeElementData = getChargeElementData;
exports.getChargeElementActionUrl = getChargeElementActionUrl;
