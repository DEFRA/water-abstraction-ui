const crmConnector = require('../connectors/crm');
const { get } = require('lodash');
const logger = require('../logger');

const shouldLoadRoles = request => request.auth.isAuthenticated;

const getEntityId = request => get(request, 'auth.credentials.entity_id');

const getEntityRoles = async request => {
  const entityId = getEntityId(request);
  const { error, data: roles } = await crmConnector.entityRoles.setParams({ entityId }).findMany();

  if (error) {
    error.params = {
      credentials: request.auth.credentials
    };
    throw error;
  }
  return roles;
};

const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPostAuth',
      async method (request, h) {
        if (shouldLoadRoles(request)) {
          try {
            request.entityRoles = await getEntityRoles(request);
          } catch (error) {
            logger.error('Failed to load entity roles', error);
          }
        }
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'entityRolesPlugin',
    version: '2.0.0'
  }
};

module.exports = plugin;
