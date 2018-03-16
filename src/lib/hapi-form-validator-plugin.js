/**
* HAPI form validator plugin
* Allows validation logic to be part of route configuration, automatically placing
* validation result on current request
*
* @module lib/hapi-view-context-plugin
*/
const Joi = require('joi');

const formValidator = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        if ('formValidator' in request.route.settings.plugins) {
          const { payload: payloadSchema } = request.route.settings.plugins.formValidator;

          if (payloadSchema) {
            const { error, value } = Joi.validate(request.payload, payloadSchema);
            request.formError = error;
            request.formValue = value;
          }
        }

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

formValidator.register.attributes = {
  name: 'formValidator',
  version: '1.0.0'
};

module.exports = formValidator;
