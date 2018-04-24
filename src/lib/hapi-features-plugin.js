/**
 * HAPI features plugin
 * Makes it possible to switch on/off features depending on current environment
 * or in future other logic
 *
 * @module lib/hapi-features-plugin
 *
 * @example
  {
     // HAPI features plugin
     register: require('./src/lib/hapi-features-plugin.js'),
     options: {
       features: {
         someFeat: {
           environment: /^(prod|preprod)$/i
         }
       }
     }
   }
 */
const { mapValues } = require('lodash');

const featuresPlugin = {
  register (server, options, next) {
    server.ext({
      type: 'onPreHandler',
      method: async (request, reply) => {
        // Environment test
        const features = mapValues(options.features, (featureConfig) => {
          if ('environment' in featureConfig) {
            return featureConfig.environment.test(process.env.NODE_ENV);
          }
          return true;
        });

        // Attach to request
        request.features = features;

        // Continue processing request
        return reply.continue();
      }
    });

    return next();
  }
};

featuresPlugin.register.attributes = {
  name: 'featuresPlugin',
  version: '1.0.0'
};

module.exports = featuresPlugin;
