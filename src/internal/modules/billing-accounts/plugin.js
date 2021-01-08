'use strict';

const Joi = require('@hapi/joi');
const routes = Object.values(require('./routes'));

const session = require('./lib/session');
const routing = require('./lib/routing');

const OPTIONS_SCHEMA = Joi.object({
  back: Joi.string().required(),
  redirectPath: Joi.string().required(),
  companyId: Joi.string().guid().required(),
  regionId: Joi.string().guid().required(),
  key: Joi.string().required(),
  caption: Joi.string().optional(),
  data: Joi.object().optional().default({}),
  startDate: Joi.string().isoDate().required()
});

/**
 * This function stores data in the session and returns
 * a path which can start the flow
 * @param {Object} options
 * @return {String} path
 */
function billingAccountEntryRedirect (options) {
  // Validate options
  Joi.assert(options, OPTIONS_SCHEMA);

  // Store in session
  session.set(this, options.key, options);

  const { key } = options;

  // Return redirect path to enter flow
  return routing.getSelectExistingBillingAccount(key);
}

/**
 * Get the data set in the flow
 * @param {String} key
 * @return {Object}
 */
function getBillingAccount (key) {
  return (session.get(this, key) || {}).data;
}

const billingAccountsPlugin = {
  register: server => {
    // Register method to initiate flow and get data
    server.decorate('request', 'billingAccountEntryRedirect', billingAccountEntryRedirect);
    server.decorate('request', 'getBillingAccount', getBillingAccount);

    // Register routes
    server.route(routes);
  },
  pkg: {
    name: 'billingAccountsPlugin',
    version: '2.0.0',
    dependencies: ['addressEntryPlugin', 'accountEntryPlugin', 'contactEntryPlugin']
  }
};

module.exports = billingAccountsPlugin;
