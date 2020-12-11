'use strict';

const saveToSession = (request, sessionKey, data = {}) => {
  // get existing session data
  let sessionData = request.yar.get(sessionKey);
  // merge the new with old data
  // NB any existing data points will be overwritten with new data
  sessionData = Object.assign(sessionData || {}, data);
  // set the new session data
  request.yar.set(sessionKey, sessionData);
  return sessionData;
};

exports.saveToSession = saveToSession;
