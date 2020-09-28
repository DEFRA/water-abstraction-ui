'use strict';

const urlJoin = require('url-join');

const { handleRequest, getValues } = require('shared/lib/forms/');
const { reducer } = require('./reducer');

const getSessionKey = request => `licence.${request.params.licenceId}.create-agreement`;

const getSessionData = request => request.yar.get(getSessionKey(request));
const setSessionData = (request, data) => request.yar.set(getSessionKey(request), data);
const clearSessionData = request => request.yar.clear(getSessionKey(request));

const createPostHandler = (request, h, formContainer, actionCreator, tail) => {
  const form = handleRequest(formContainer.form(request), request, formContainer.schema(request));
  if (form.isValid) {
    const currentState = getSessionData(request);
    const nextState = reducer(currentState, actionCreator(request, getValues(form)));
    setSessionData(request, nextState);

    // Redirect to next page in flow
    if (tail) {
      return h.redirect(urlJoin(`/licences/${request.pre.licence.id}/agreements/`, tail));
    }
  }
  // Redirect to redisplay form with errors
  return h.postRedirectGet(form);
};

exports.getSessionData = getSessionData;
exports.createPostHandler = createPostHandler;
exports.clearSessionData = clearSessionData;
