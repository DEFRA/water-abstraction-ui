/**
 * Ensures that user has admin permissions on all admin routes
 *
 * @module lib/hapi-admin-firewall-plugin
 */
/* eslint "new-cap" : ["warn", { "newIsCap": true }] */
const Boom = require('boom');
const { hasScope } = require('../permissions');
const { scope } = require('../constants');

const adminFirewallPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        const { path } = request.url;

        // Detect any URL starting /admin
        if (/\/admin/i.test(path)) {
          if (!hasScope(request, scope.internal)) {
            throw Boom.unauthorized(`internal scope required to view ${path}`);
          }
        }
        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'adminFirewall',
    version: '2.0.0'
  }
};

module.exports = adminFirewallPlugin;
