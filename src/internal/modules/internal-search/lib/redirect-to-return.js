const Boom = require('@hapi/boom');
const { get } = require('lodash');

/**
 * Redirects the user to the return if there is a single matched return in the
 * search results, and a path is set for the return
 * @param  {String} returnId
 * @param  {Object} view  - view data
 * @param  {Object} h     - HAPI response toolkit
 * @return {Object}       - HAPI HTTP redirect response
 */
const redirectToReturn = (returnId, view, h) => {
  if (get(view, 'returns.length') === 1) {
    const path = get(view, 'returns[0].path');
    if (path) {
      return h.redirect(path);
    }
    throw Boom.unauthorized(`Return ${returnId} cannot be accessed by the current role`);
  }
  // No return was found for the specified return ID
  throw Boom.notFound(`Return ${returnId} not found`);
};

module.exports = {
  redirectToReturn
};
