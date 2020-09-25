'use-strict';

const sessionHelpers = require('shared/lib/session-helpers');

const saveCustomCharge = (request, licenceId, elementId, sessionData) => {
  const { draftChargeInformation } = request.pre;
  // add the charge element to the draft charge information
  const index = draftChargeInformation.chargeElements.findIndex((element) => element.id === elementId);
  index >= 0 ? draftChargeInformation.chargeElements[index] = { ...sessionData, id: elementId }
    : draftChargeInformation.chargeElements.push({ ...sessionData, id: elementId });
  request.server.methods.setDraftChargeInformation(licenceId, draftChargeInformation);
};

// session data is stored at charge-elements-licence-ref
const sessionManager = (request, licenceId, elementId, data) => {
  const sessionKey = `chargeElement.${licenceId}.${elementId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

exports.saveCustomCharge = saveCustomCharge;
exports.sessionManager = sessionManager;
