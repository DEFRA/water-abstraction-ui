'use-strict';

const routing = require('./routing');
const qs = require('querystring');

const getChargeElementData = request => {
  const { draftChargeInformation } = request.pre;
  const { elementId } = request.params;
  const chargeElement = draftChargeInformation.chargeElements.find(element => element.id === elementId);
  return chargeElement || {};
};

const getActionUrl = (request, url) => {
  const { returnToCheckData } = request.query;
  if (returnToCheckData === 1) {
    return `${url}?${qs.stringify({ returnToCheckData })}`;
  }
  return url;
};

const getChargeElementActionUrl = (request, step) => {
  const { licenceId, elementId } = request.params;
  const url = routing.getChargeElementStep(licenceId, elementId, step);
  return getActionUrl(request, url);
};

exports.getChargeElementData = getChargeElementData;
exports.getActionUrl = getActionUrl;
exports.getChargeElementActionUrl = getChargeElementActionUrl;
