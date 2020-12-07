'use strict';

const Joi = require('@hapi/joi');
const routes = Object.values(require('./routes'));

const session = require('./lib/session');

const OPTIONS_SCHEMA = Joi.object({
  back: Joi.string().required(),
  caption: Joi.string().optional().default(null),
  key: Joi.string().required(),
  redirectPath: Joi.string().required()
});

/**
 * This function stores data in the session and returns
 * a path which can start the flow
 * @param {Object} options
 * @return {String} path
 */
function addressLookupRedirect (options) {
  // Validate options
  Joi.assert(options, OPTIONS_SCHEMA);

  // Store in session
  session.set(this, options.key, options);

  // Return redirect path to enter flow
  return `/address-entry/${options.key}/postcode`;
}

/**
 * Get the data set in the flow
 * @param {String} key
 * @return {Object}
 */
function getNewAddress (key) {
  return (session.get(this, key) || {}).data;
}

const addressLookupPlugin = {
  register: (server, options) => {
    // Register method to initiate flow and get data
    server.decorate('request', 'addressLookupRedirect', addressLookupRedirect);
    server.decorate('request', 'getNewAddress', getNewAddress);

    // Register flow routes
    server.route(routes);
  },

  pkg: {
    name: 'addressLookupPlugin',
    version: '1.0.0'
  }
};

module.exports = addressLookupPlugin;
