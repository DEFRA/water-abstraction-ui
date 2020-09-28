const sessionHelpers = require('shared/lib/session-helpers');

const sessionManager = (request, agreementId, data) => {
  const sessionKey = `endAgreement.${agreementId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

exports.sessionManager = sessionManager;
