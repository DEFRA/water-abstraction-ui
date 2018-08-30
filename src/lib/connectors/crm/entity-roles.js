/**
 * Creates a client connector for the CRM entity roles API endpoint
 * @module lib/connectors/crm/entity-roles
 */
const { APIClient } = require('hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

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

client.deleteColleagueRole = async function (entityId, entityRoleId) {
  const uri = process.env.CRM_URI + '/entity/' + entityId + '/colleagues/' + entityRoleId + '?token=' + process.env.JWT_TOKEN;
  const options = { method: `DELETE`, uri };
  try {
    const response = await rp(options);
    return Promise.resolve(response);
  } catch (error) {
    Promise.reject(error);
  }
};

client.addColleagueRole = async function (entityID, colleagueEntityID, role = 'user') {
  const uri = process.env.CRM_URI + '/entity/' + entityID + '/colleagues/?token=' + process.env.JWT_TOKEN;
  const data = { colleagueEntityID, role };
  const options = { method: `POST`, uri, json: true, body: data };

  try {
    const response = await rp(options);
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

module.exports = client;
