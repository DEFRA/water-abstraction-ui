const { logger } = require('../logger');

const { isAuthenticated } = require('./permissions');

/**
 * A pre-handler to redirect the user to the correct page if they attempt
 * to access the current page while authenticated
 * This for pages such as register, sign in etc.
 */
const preRedirectIfAuthenticated = async (request, h) => {
  if (isAuthenticated(request)) {
    const path = '/licences';
    logger.info('Redirecting authenticated user', { from: request.path, path });
    return h.redirect(path).takeover();
  }
  return h.continue;
};

exports.preRedirectIfAuthenticated = preRedirectIfAuthenticated;
