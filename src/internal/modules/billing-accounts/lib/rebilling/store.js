'use strict';

const reducer = require('./reducer');

const getSessionKey = request =>
  `rebilling.${request.params.billingAccountId}`;

const getState = request => {
  const sessionKey = getSessionKey(request);
  return request.yar.get(sessionKey);
};

const dispatch = (request, action) => {
  const sessionKey = getSessionKey(request);
  const currentState = request.yar.get(sessionKey);
  const nextState = reducer(currentState, action);
  return request.yar.set(sessionKey, nextState);
};

const clearState = request => {
  const sessionKey = getSessionKey(request);
  return request.yar.clear(sessionKey);
};

exports.dispatch = dispatch;
exports.getState = getState;
exports.clearState = clearState;
