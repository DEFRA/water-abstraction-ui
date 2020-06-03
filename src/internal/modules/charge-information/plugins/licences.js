const { get } = require('lodash');
const services = require('../../../lib/connectors/services');

const getOptions = segment => ({
  cache: {
    segment,
    expiresIn: 1000 * 60 * 15, // 15 minutes
    generateTimeout: 2000
  }
});

const cachedServiceRequest = (path, ...params) => {
  const segments = path.split('.');
  const method = segments.pop();
  const objectPath = segments.join('.');
  return get(services, objectPath)[method](...params);
};

const licencesPlugin = {
  register: (server, options) => {
    server.method('cachedServiceRequest', cachedServiceRequest, getOptions('cachedServiceRequest'));
  },

  pkg: {
    name: 'licencesPlugin',
    version: '1.0.0'
  }
};

module.exports = licencesPlugin;
