'use strict';
const sessionHelpers = require('shared/lib/session-helpers');
const urlJoin = require('url-join');

const { handleRequest, getValues } = require('shared/lib/forms/');
const { reducer } = require('./reducer');

const endAgreementSessionManager = (request, agreementId, data) => {
  const sessionKey = `endAgreement.${agreementId}`;
  return sessionHelpers.saveToSession(request, sessionKey, data);
};

const clearEndAgreementSessionData = (request, agreementId) => {
  const sessionKey = `endAgreement.${agreementId}`;
  return request.yar.clear(sessionKey);
};

const getAddAgreementSessionKey = request => `licence.${request.params.licenceId}.create-agreement`;

const getAddAgreementSessionData = request => request.yar.get(getAddAgreementSessionKey(request));

const setAddAgreementSessionData = (request, data) => request.yar.set(getAddAgreementSessionKey(request), data);

const clearAddAgreementSessionData = request => request.yar.clear(getAddAgreementSessionKey(request));

/**
 * Generic post handler
 * @param {Object} request - hapi request
 * @param {Object} h - hapi response toolkit
 * @param {Object} formContainer - a form container containing { form, schema }
 * @param {Function} actionCreator - a function to create a reducer action to alter flow state
 * @param {String} tail - the URL tail to redirect to
 * @return {Object}
 */
const createAddAgreementPostHandler = (request, h, formContainer, actionCreator, tail) => {
  const form = handleRequest(formContainer.form(request), request, formContainer.schema(request));
  if (form.isValid) {
    const currentState = getAddAgreementSessionData(request);
    const nextState = reducer(currentState, actionCreator(request, getValues(form)));
    setAddAgreementSessionData(request, nextState);

    // Redirect to next page in flow
    return h.redirect(urlJoin(`/licences/${request.pre.licence.id}/agreements/`, tail));
  }
  // Redirect to redisplay form with errors
  return h.postRedirectGet(form);
};

exports.endAgreementSessionManager = endAgreementSessionManager;
exports.clearEndAgreementSessionData = clearEndAgreementSessionData;

exports.getAddAgreementSessionData = getAddAgreementSessionData;
exports.createAddAgreementPostHandler = createAddAgreementPostHandler;
exports.clearAddAgreementSessionData = clearAddAgreementSessionData;
