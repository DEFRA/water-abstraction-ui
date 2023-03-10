'use strict'
const { assert } = require('@hapi/hoek')

const routes = require('./routes')

module.exports = {
  name: 'updatePasswordPlugin',
  version: '1.0.0',
  register: async function (server, options) {
    // Validate plugin options
    assert(typeof options.authenticate === 'function', 'authenticate must be a function')
    assert(typeof options.updatePassword === 'function', 'updatePassword must be a function')

    // Import routes
    server.route(routes)
  }
}
