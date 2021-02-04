'use strict';

const Joi = require('@hapi/joi');
const routes = Object.values(require('./routes'));

const session = require('./lib/session');
const routing = require('./lib/routing');

const OPTIONS_SCHEMA = Joi.object({
  back: Joi.string().required(),
  redirectPath: Joi.string().required(),
  key: Joi.string().required(),
  caption: Joi.string().optional(),
  data: Joi.when(
    'isUpdate', {
      is: true,
      then: Joi.object({
        id: Joi.string().guid(),
        company: Joi.object()
      }),
      otherwise: Joi.object().optional().default({})
    }
  ),
  isUpdate: Joi.boolean().optional().default(false).notes('True if updating an existing billing account'),
  startDate: Joi.when(
    'isUpdate', {
      is: true,
      then: Joi.forbidden(),
      otherwise: Joi.string().isoDate().required()
    }
  ),
  companyId: Joi.when(
    'isUpdate', {
      is: true,
      then: Joi.forbidden(),
      otherwise: Joi.string().guid().required()
    }
  ),
  regionId: Joi.when(
    'isUpdate', {
      is: true,
      then: Joi.forbidden(),
      otherwise: Joi.string().guid().required()
    }
  )
});

const mapOptions = options => {
  if (!options.isUpdate) {
    return options;
  }
  return {
    ...options,
    companyId: options.data.company.id
  };
};

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
  session.set(this, options.key, mapOptions(options));

  const { key } = options;

  // Return redirect path to enter flow
  return options.isUpdate
    ? routing.getSelectAccount(key)
    : routing.getSelectExistingBillingAccount(key);
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
module.exports._billingAccountEntryRedirect = billingAccountEntryRedirect;
module.exports._getBillingAccount = getBillingAccount;
