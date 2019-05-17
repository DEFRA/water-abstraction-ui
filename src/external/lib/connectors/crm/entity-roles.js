/**
 * Creates a client connector for the CRM entity roles API endpoint
 * @module lib/connectors/crm/entity-roles
 */
const { APIClient, throwIfError } = require('@envage/hapi-pg-rest-api');
const serviceRequest = require('../../../../shared/lib/connectors/service-request');

const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

const { logger } = require('../../../logger');

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/entity/{entityId}/roles`,
  headers: { Authorization: process.env.JWT_TOKEN }
});

client.getEditableRoles = async function (entityId, sort = 'entity_nm', direction = 1) {
  const uri = process.env.CRM_URI + '/entity/' + entityId + '/colleagues?sort=' + sort + '&direction=' + direction + '&token=' + process.env.JWT_TOKEN;
  const options = { method: `GET`, uri };
  try {
    const response = await rp(options);
    return Promise.resolve(response);
  } catch (error) {
    Promise.reject(error);
  }
};

client.deleteColleagueRole = function (entityId, entityRoleId) {
  const uri = process.env.CRM_URI + '/entity/' + entityId + '/colleagues/' + entityRoleId;

  const options = {
    method: `DELETE`,
    headers: { Authorization: process.env.JWT_TOKEN },
    uri
  };

  return rp(options);
};

client.addColleagueRole = async function (entityID, colleagueEntityID, role = 'user') {
  const uri = process.env.CRM_URI + '/entity/' + entityID + '/colleagues/?token=' + process.env.JWT_TOKEN;
  const data = { colleagueEntityID, role };
  const options = { method: `POST`, uri, json: true, body: data };

  try {
    const response = await rp(options);
    return response;
  } catch (error) {
    logger.error('Error adding colleague role', error);
    throw error;
  }
};

/**
 * Gets roles for an entity within a company
 * @param  {String}  entityId        - CRM individual entity ID
 * @param  {String}  companyEntityId - CRM company entity ID
 * @return {Promise}                 resolves with array of roles
 */
client.getCompanyRoles = async (entityId, companyEntityId) => {
  const uri = process.env.CRM_URI + '/entity/' + entityId + '/roles';
  const filter = {
    company_entity_id: companyEntityId
  };
  const options = {
    qs: {
      filter: JSON.stringify(filter)
    }
  };

  const { error, data } = await serviceRequest.get(uri, options);
  throwIfError(error);

  return data;
};

module.exports = client;
