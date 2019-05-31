/**
 * HAPI form validator plugin
 * Allows validation logic to be part of route configuration, automatically placing
 * validation result on current request
 *
 * @module lib/hapi-form-validator-plugin
 */
const Joi = require('joi');
const formatViewError = require('shared/lib/format-view-error');

const formValidator = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        if ('formValidator' in request.route.settings.plugins) {
          const { payload, query, options = {} } = request.route.settings.plugins.formValidator;
          let data, schema;

          if (payload) {
            schema = payload;
            data = request.payload;
          } else if (query) {
            schema = query;
            data = request.query;
          } else {
            return reply.continue();
          }

          const { error, value } = Joi.validate(data, schema, options);
          request.formError = error;
          request.formValue = value;
          request.view.errors = formatViewError(error);
        }

        // Continue processing request
        return reply.continue;
      }
    });
  },

  pkg: {
    name: 'formValidator',
    version: '2.0.0'
  }
};

module.exports = formValidator;
