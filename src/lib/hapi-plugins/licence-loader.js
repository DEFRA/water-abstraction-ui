const crmDocumentConnector = require('../connectors/crm/documents');
const crmVerifcationConnector = require('../connectors/crm/verification');
const { set, get } = require('lodash');

const addToRequest = (request, key, value) => set(request, `licence.${key}`, value);

const getEntityId = request => request.auth.credentials.entity_id;
const getCompanyId = request => get(request, 'auth.credentials.companyId');

const loadUserLicenceCount = async request => {
  const companyId = getCompanyId(request);
  const licenceCount = await crmDocumentConnector.getLicenceCount(companyId);
  addToRequest(request, 'userLicenceCount', licenceCount);
};

const loadOutstandingVerifications = async request => {
  const entityId = getEntityId(request);
  const { data: verifications } = await crmVerifcationConnector.getOutstandingVerifications(entityId);
  addToRequest(request, 'outstandingVerifications', verifications);
};

/*
 * Maps the settings key to a functin that satisfies the requirement
 */
const requirementsMap = {
  loadUserLicenceCount,
  loadOutstandingVerifications
};

/*
 * For each key on the settings object the relevant loading
 * function is called in order to add the required data to
 * the request object
 */
const loadRequirements = async (request, settings) => {
  const requirements = Object.keys(settings).reduce((acc, key) => {
    return settings[key] === true
      ? [...acc, key]
      : acc;
  }, []);

  const promises = requirements.map(requirement => {
    return requirementsMap[requirement](request);
  });

  return Promise.all(promises);
};

const plugin = {
  register: (server, options) => {
    server.ext({
      type: 'onPreHandler',
      async method (request, h) {
        if (get(request, 'auth.isAuthenticated') === true) {
          const settings = get(request, 'route.settings.plugins.licenceLoader');

          if (settings) {
            await loadRequirements(request, settings);
          }
        }
        return h.continue;
      }
    });
  },

  pkg: {
    name: 'licenceLoaderPlugin',
    version: '2.0.0'
  }
};

module.exports = plugin;
