/**
 * Ensures that user has admin permissions on all admin routes
 *
 * @module lib/hapi-admin-firewall-plugin
 */
/* eslint "new-cap" : ["warn", { "newIsCap": true }] */
const Boom = require('boom');

const adminFirewallPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        const { path } = request.url;

        // Detect any URL starting /admin
        if (/\/admin/i.test(path)) {
          if (!request.permissions.admin.defra) {
            return reply(new Boom.unauthorized(`admin.defra permission required to view ${path}`));
          }
        }
        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

adminFirewallPlugin.register.attributes = {
  name: 'adminFirewall',
  version: '1.0.0'
};

module.exports = adminFirewallPlugin;
