'use strict'

const Joi = require('joi')
const routes = Object.values(require('./routes'))

const session = require('./lib/session')
const routing = require('./lib/routing')

const OPTIONS_SCHEMA = Joi.object().keys({
  back: Joi.string().required(),
  redirectPath: Joi.string().required(),
  caption: Joi.string().optional().default(null),
  searchQuery: Joi.string().required().trim(),
  key: Joi.string().required(),
  data: Joi.object().optional()
})

/**
 * This function stores data in the session and returns
 * a path which can start the flow
 * @param {Object} options
 * @return {String} path
 */
function accountEntryRedirect (options) {
  // Validate options
  Joi.assert(options, OPTIONS_SCHEMA)

  // Store in session
  session.set(this, options.key, options)

  const { key, searchQuery } = options

  // Return redirect path to enter flow
  return routing.getSelectExistingAccount(key, searchQuery)
}

/**
 * Get the data set in the flow
 * @param {String} key
 * @return {Object}
 */
function getAccount (key) {
  return (session.get(this, key) || {}).data
}

const accountEntryPlugin = {
  register: server => {
    // Register method to initiate flow and get data
    server.decorate('request', 'accountEntryRedirect', accountEntryRedirect)
    server.decorate('request', 'getAccountEntry', getAccount)

    // Register flow routes
    server.route(routes)
  },

  pkg: {
    name: 'accountEntryPlugin',
    version: '2.0.0'
  }
}

module.exports = accountEntryPlugin
module.exports._accountEntryRedirect = accountEntryRedirect
module.exports._getAccountEntry = getAccount
