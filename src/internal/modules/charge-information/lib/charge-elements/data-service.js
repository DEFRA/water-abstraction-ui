'use-strict';

const sessionHelpers = require('shared/lib/session-helpers');

const saveCustomCharge = (request, licenceId, sessionData) => {
  const { draftChargeInformation } = request.pre;
  // add the charge element to the draft charge information
  draftChargeInformation.abstractionData
    ? draftChargeInformation.abstractionData.push(sessionData)
    : draftChargeInformation.abstractionData = [sessionData];
  request.server.methods.setDraftChargeInformation(licenceId, draftChargeInformation);
  // clear the charge element session data
  request.yar.clear(`chargeElement.${licenceId}`);
};

// session data is stored at charge-elements-licence-ref
const sessionManager = (request, licenceId, data) => {
  const sessionKey = `chargeElement.${licenceId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

exports.saveCustomCharge = saveCustomCharge;
exports.sessionManager = sessionManager;
