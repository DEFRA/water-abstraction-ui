'use strict';
const Joi = require('@hapi/joi');
const routes = Object.values(require('./routes'));
const session = require('./lib/session');

const OPTIONS_SCHEMA = Joi.object({
  back: Joi.string().required(),
  caption: Joi.string().optional().default(null),
  key: Joi.string().required(),
  redirectPath: Joi.string().required(),
  companyId: Joi.string().guid().required(),
  data: Joi.object().optional()
});

/**
 * This function stores data in the session and returns
 * a path which can start the flow
 * @param {Object} options
 * @return {String} path
 */
function contactEntryRedirect (options) {
  // Validate options
  Joi.assert(options, OPTIONS_SCHEMA);

  // Store in session
  session.set(this, options.key, options);

  // Return redirect path to enter flow
  return `/contact-entry/${options.key}/select-contact`;
}

/**
 * Get the data set in the flow
 * @param {String} key
 * @return {Object}
 */
function getNewContact (key) {
  return (session.get(this, key) || {}).data;
}

const contactEntryPlugin = {
  register: (server, options) => {
    // Register method to initiate flow and get data
    server.decorate('request', 'contactEntryRedirect', contactEntryRedirect);
    server.decorate('request', 'getNewContact', getNewContact);

    // Register flow routes
    server.route(routes);
  },

  pkg: {
    name: 'contactEntryPlugin',
    version: '1.0.0'
  }
};

module.exports = contactEntryPlugin;
