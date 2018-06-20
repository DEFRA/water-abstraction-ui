/**
 * Polyfill hapi-route-acl plugin for HAPI 17
 */
const hapiRouteAcl = require('hapi-route-acl');
const { promisify } = require('util');

module.exports = {
  register: promisify(hapiRouteAcl.register),
  pkg: hapiRouteAcl.register.attributes.pkg
};
