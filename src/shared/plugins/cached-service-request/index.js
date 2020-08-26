'use strict';

/**
 * A plugin to cache the results of service request
 */
const { get } = require('lodash');

const methodOptions = {
  cache: {
    segment: 'cachedServiceRequest',
    expiresIn: 1000 * 60 * 15, // 15 minutes
    generateTimeout: 2000
  }
};

const cachedServiceRequest = (services, path, ...params) => {
  const segments = path.split('.');
  const method = segments.pop();
  const objectPath = segments.join('.');
  return get(services, objectPath)[method](...params);
};

const cachedServiceRequestPlugin = {
  register: (server, options) => {
    const method = (...args) => cachedServiceRequest(options.services, ...args);
    server.method('cachedServiceRequest', method, methodOptions);
  },

  pkg: {
    name: 'cachedServiceRequest',
    version: '1.0.0'
  }
};

module.exports = cachedServiceRequestPlugin;
