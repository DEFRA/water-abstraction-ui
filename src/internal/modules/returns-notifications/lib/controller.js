'use strict';

/**
 * @module generic GET/POST handler for paper forms flow
 */

const { isFunction } = require('lodash');

const { handleRequest, getValues } = require('shared/lib/forms');
const { SESSION_KEYS } = require('./constants');
const reducer = require('./reducer');

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
  const view = {
    ...request.view,
    caption: `Licence ${document.document.licenceNumber}`,
    back: checkAnswersRoute,
    form: formContainer.form(request, document)
  };
  return h.view('nunjucks/form', view);
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
  const { document } = request.pre;

  const schema = formContainer.schema(request, document);
  const form = handleRequest(formContainer.form(request, document), request, schema);

  if (!form.isValid) {
    return h.postRedirectGet(form);
  }

  const currentState = request.yar.get(SESSION_KEYS.paperFormsFlow);
  const nextState = reducer.reducer(currentState, actionCreator(request, getValues(form)));
  request.yar.set(SESSION_KEYS.paperFormsFlow, nextState);

  const path = isFunction(redirectPath) ? redirectPath(request) : redirectPath;
  return h.redirect(path);
};

exports.createGetHandler = createGetHandler;
exports.createPostHandler = createPostHandler;
