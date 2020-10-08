'use strict';

/**
 * Gets the form action
 * This is the same as the current request path, but can optionally have
 * a ?check=1 query parameter added if the user is going through
 * the "check your answers" page
 * @param {Object} request - hapi request
 * @return {String} form action path
 */
const getFormAction = request => {
  return `${request.url.pathname}${request.url.search}`;
};

exports.getFormAction = getFormAction;
