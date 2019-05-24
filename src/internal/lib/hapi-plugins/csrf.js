/**
 * HAPI CSRF plugin
 * For post handlers on authenticated routes, checks the CSRF token is present
 * and matches that in the user's session
 * Also checks the referer header to ensure request came from same site
 *
 * @module lib/hapi-plugins/csrf
 */
const { URL } = require('url');
const Boom = require('boom');
const Joi = require('joi');
const { get } = require('lodash');

/**
 * Validates request payload to ensure that supplied csrf_token is
 * a valid GUID
 * If not, a Boom error is thrown
 * @param {Object} payload - from HAPI request.payload
 * @param {String} payload.csrf_token
 */
function validatePayload (payload) {
  const payloadSchema = {
    csrf_token: Joi.string().guid().required()
  };
  const joiOptions = {
    allowUnknown: true
  };
  const { error } = Joi.validate(payload, payloadSchema, joiOptions);
  if (error) {
    throw Boom.badRequest('CSRF protection: invalid CSRF token', { isCsrfError: true });
  }
}

const csrfPlugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        // Ignore GET requests
        if (request.method === 'get') {
          return reply.continue;
        }

        // Ignore unauthenticated routes
        if (!request.auth.isAuthenticated) {
          return reply.continue;
        }

        // Check referrer if header is set
        if (request.headers.referer) {
          const currentHost = new URL(`${request.info.protocol}://${request.info.host}`);
          const refererUrl = new URL(request.headers.referer);

          if (currentHost.hostname !== refererUrl.hostname) {
            throw Boom.badRequest('CSRF protection: invalid HTTP referer header', { isCsrfError: true });
          }
        }

        // Validate payload
        validatePayload(request.payload);

        // Check CSRF token
        const token = request.yar.get('csrf_token');
        if (token !== get(request, 'payload.csrf_token')) {
          throw Boom.badRequest('CSRF protection: missing/invalid CSRF token', { isCsrfError: true });
        }

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'csrfPlugin',
    version: '2.0.0'
  }
};

module.exports = csrfPlugin;
