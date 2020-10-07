const sessionHelpers = require('shared/lib/session-helpers');

const sessionManager = (request, agreementId, data) => {
  const sessionKey = `endAgreement.${agreementId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

const clearSession = (request, agreementId) => {
  const sessionKey = `endAgreement.${agreementId}`;
  return request.yar.clear(sessionKey);
};

exports.sessionManager = sessionManager;
exports.clearSession = clearSession;
