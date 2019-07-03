/**
 * This plugin will redirect a user to the select-company route
 * of the user has not selected a company, but does have entity roles
 * and therefore a company.
 *
 * If the user has no company then they will be redirected to the
 * add-licences route.
 *
 * Both of the above redirections will only take place if the user is
 * attempting to access a route that is configured with an access scope.
 */
const { get, isEmpty } = require('lodash');
const SELECT_COMPANY_PATH = '/select-company';
const ADD_LICENCES_PATH = '/add-licences';

const shouldRedirect = request => {
  const { companyId } = request.defra;
  const { path } = request;
  const access = get(request, 'route.settings.auth.access', {});

  return (isEmpty(access) && !companyId && path !== SELECT_COMPANY_PATH);
};

const getRedirectPath = companyCount => {
  return companyCount === 0 ? ADD_LICENCES_PATH : SELECT_COMPANY_PATH;
};

const handler = (request, h) => {
  if (request.auth.isAuthenticated && shouldRedirect(request)) {
    const path = getRedirectPath(request.defra.companyCount);
    return h.redirect(path).takeover();
  }
  return h.continue;
};

const plugin = {
  register: (server) => {
    server.ext({
      type: 'onPreResponse',
      method: handler
    });
  },
  pkg: {
    name: 'companySelection',
    version: '2.0.0'
  },
  dependencies: ['hapi-auth-cookie', 'authPlugin']
};

module.exports = plugin;
module.exports._handler = handler;
