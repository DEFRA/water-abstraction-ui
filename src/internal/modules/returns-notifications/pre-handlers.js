'use strict';

const Boom = require('@hapi/boom');

const { SESSION_KEYS } = require('./lib/constants');

/**
 * Gets full session state for the flow
 * @param {Object} request - hapi request
 * @return {Object} session state
 */
const getStateFromSession = request =>
  request.yar.get(SESSION_KEYS.paperFormsFlow);

/**
 * Gets the requested document by ID from the paper forms flow session data
 * @param {Object} request - hapi request
 * @return {Object} the document, or a Boom 404 error
 */
const getDocumentFromSession = request => {
  const { documentId } = request.params;
  const state = request.yar.get(SESSION_KEYS.paperFormsFlow);
  return state[documentId] || Boom.notFound(`Document ${documentId} not found in session`);
};

exports.getStateFromSession = getStateFromSession;
exports.getDocumentFromSession = getDocumentFromSession;
