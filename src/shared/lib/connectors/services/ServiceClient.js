/**
 * ServiceClient is a base class for services that do not
 * extend the ApiClient base because they don't interact
 * with the servive via the HAPI Rest API.
 */

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const urlJoin = require('url-join');

class ServiceClient {
  constructor (serviceEndpoint, logger) {
    this.serviceEndpoint = serviceEndpoint;
    this.logger = logger || console;
    this.serviceRequest = serviceRequest;
  }

  joinUrl (...parts) {
    const stringParts = parts.map(part => part.toString());
    return urlJoin(this.serviceEndpoint, ...stringParts);
  }
}

module.exports = ServiceClient;
