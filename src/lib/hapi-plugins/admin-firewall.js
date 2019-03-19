/**
 * Ensures that user has admin permissions on all admin routes
 *
 * @module lib/hapi-admin-firewall-plugin
 */
/* eslint "new-cap" : ["warn", { "newIsCap": true }] */
const Boom = require('boom');
const { get } = require('lodash');
const { hasScope } = require('../permissions');
const { scope } = require('../constants');

const isRouteWithAccess = request => get(request, 'route.settings.auth.access', false);

/**
 * A handler which throws an unauthorized error if:
 * - Access is required on the requested route, and
 * - The route is an admin route, and
 * - The user does not have internal scope
 * @return {Promise} resolves with h.continue
 */
const _handler = (request, h) => {
  const { path } = request.url;

  const isAdminRoute = /\/admin/i.test(path);
  const isAccessRoute = isRouteWithAccess(request);

  if (isAdminRoute && isAccessRoute) {
    if (!hasScope(request, scope.internal)) {
      throw Boom.unauthorized(`internal scope required to view ${path}`);
    }
  }

  // Continue processing request
  return h.continue;
};

const adminFirewallPlugin = {
  register: (server) => {
    server.ext({
      type: 'onPreHandler',
      method: _handler
    });
  },

  pkg: {
    name: 'adminFirewall',
    version: '2.0.0'
  }
};

module.exports = adminFirewallPlugin;
module.exports._handler = _handler;
