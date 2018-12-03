/**
 * Creates a client connector for the CRM entities API endpoint
 * @module lib/connectors/crm-verification
 */
const { APIClient } = require('@envage/hapi-pg-rest-api');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

// Create API client
const client = new APIClient(rp, {
  endpoint: `${process.env.CRM_URI}/entity`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

/**
 * Gets or creates an individual entity for an individual
 * with the supplied email address
 * @param {String} emailAddress
 * @param {String} [entityType] - the entity type individual | company
 * @return {Promise} resolves with entity ID
 */
client.getOrCreateIndividual = async function (emailAddress) {
  const entityData = {
    entity_nm: emailAddress.toLowerCase().trim(),
    entity_type: 'individual'
  };

  // Get existing entity
  const {error, data} = await client.findMany(entityData);

  // CRM error
  if (error) {
    throw error;
  }

  if (data.length > 1) {
    throw new Error(`${data.length} records found looking for entity with name ${entityData.entity_nm}`);
  }

  if (data.length === 1) {
    return data[0].entity_id;
  }

  // Create new entity
  const { data: createData, error: createError } = await client.create(entityData);

  if (createError) {
    throw createError;
  }
  return createData.entity_id;
};

module.exports = client;
