'use strict';

/**
 * @module generic GET/POST handler for paper forms flow
 */

const { isFunction } = require('lodash');

const { handleRequest, getValues } = require('shared/lib/forms');
const { SESSION_KEYS } = require('./constants');
const reducer = require('./reducer');
const sessionForms = require('shared/lib/session-forms');

const checkAnswersRoute = '/returns-notifications/check-answers';

/**
 * Creates a GET handler
 * @param {Object} request - hapi request
 * @param {Object} h - hapi response toolkit
 * @param {Object} formContainer - containing form and schema objects, { form, schema }
 * @return {Object}
 */
const createGetHandler = async (request, h, formContainer) => {
  const { document } = request.pre;
  const form = sessionForms.get(request, formContainer.form(request));
  const view = {
    ...request.view,
    caption: document && `Licence ${document.document.licenceNumber}`,
    back: checkAnswersRoute,
    form
  };
  return h.view('nunjucks/form', view);
};

const processAction = (request, action) => {
  const currentState = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const nextState = reducer.reducer(currentState, action);
  request.yar.set(SESSION_KEYS.paperFormsFlow, nextState);
  return nextState;
};

/**
 * Creates a POST handler
 * @param {Object} request - hapi request
 * @param {Object} h - hapi response toolkit
 * @param {Object} formContainer - containing form and schema objects, { form, schema }
 * @param {Object} actionCreator - a function creating an action object for the reducer
 * @param {String|Function} - redirect path, or a function that generates the string
 * @return {Object}
 */
const createPostHandler = async (request, h, formContainer, actionCreator, redirectPath) => {
  const schema = formContainer.schema(request);
  const form = handleRequest(formContainer.form(request), request, schema);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  processAction(request, actionCreator(request, getValues(form)));

  const path = isFunction(redirectPath) ? redirectPath(request) : redirectPath;
  return h.redirect(path);
};

exports.createGetHandler = createGetHandler;
exports.processAction = processAction;
exports.createPostHandler = createPostHandler;
