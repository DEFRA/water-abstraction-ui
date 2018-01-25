/**
 * Provides convenience methods for HTTP API requests from the tactical CRM
 * @module lib/connectors/crm
 */
const rp = require('request-promise-native').defaults({
    proxy:null,
    strictSSL :false
  });
const moment = require('moment');
const find = require('lodash/find');

const crmVerification = require('./crm/verification');
const crmEntities = require('./crm/entities');
const crmDocuments = require('./crm/documents');
const crmEntityRoles = require('./crm/entity-roles');


/**
 * Gets a list of licences relating to outstanding verification
 * codes for the user with the individual entity specified
 * @param {String} entity_id - the individual entity ID
 * @return {Promise} resolves with array of licence document_header data
 */
async function getOutstandingLicenceRequests(entity_id) {
  // Get outstanding verifications for current user
  const res = await crmVerification.findMany({
    entity_id,
    date_verified : null
  });
  if(res.error) {
    throw res.error;
  }

  // Get array list of verification IDs
  const verification_id = res.data.map(row => row.verification_id);

  // Find licences with this ID
  const {error, data} = await crmDocuments.findMany({
    verification_id,
    verified : null
  });
  if(error) {
    throw error;
  }

  return data;
}

/**
 * Creates a new verification for the supplied combination of
 * individual, company, and a list of document header IDs
 * @param {String} entityId - the individual entity ID
 * @param {String} companyEntityId - the company entity ID
 * @param {Array} documentIds - a list of document IDs to create the verification for
 * @return {Promise} resolves with {verification_id, verification_code}
 */
async function createVerification(entityId, companyEntityId, documentIds) {

  const verificationData = {
    entity_id : entityId,
    company_entity_id : companyEntityId,
    method : 'post'
  };

  const res = await crmVerification.create(verificationData);

  const {verification_id, verification_code} = res.data;

  const res2 = await crmDocuments.updateMany({document_id : documentIds}, {verification_id});

  return res.data;
}



/**
 * Gets primary company for current user
 * @TODO assumes on only 1 company per user - may not be the case
 * @param {String} entityId - the individual entity ID
 * @return {Promise} resolves with company entity ID found
 */
async function getPrimaryCompany(entityId) {

  const res = await crmEntityRoles.setParams({entityId}).findMany({
    role : 'primary_user'
  });

  // Find role in list
  const role = find(res.data, (role) => {
    return role.company_entity_id;
  });

  return role ? role.company_entity_id : null;

}



/**
 * Gets or creates a company entity for the supplied individual entity ID
 * where the user is the primary user
 * @param {String} entityId - the individual entity ID
 * @param {String} companyName - the name of the company entity
 * @return {Promise} resolves with company entity ID found/created
 */
async function getOrCreateCompanyEntity(entityId, companyName) {

  const companyId = await getPrimaryCompany(entityId);

  if(companyId) {
    return companyId;
  }

  // No role found, create new entity
  const { data } = await crmEntities.create({entity_nm : companyName, entity_type : 'company'});

  // Create entity role
  const { data : roleData, error : roleError } = await crmEntityRoles.setParams({entityId}).create({
    company_entity_id : data.entity_id,
    role : 'primary_user'
  });

  if(roleError) {
    throw roleError;
  }

  return data.entity_id;
}


/**
 * Verification process
 * @param {String} entityId - the individual entity ID
 * @param {String} verificationCode - the code supplied by post
 * @return {Promise} resolves if verification successful
 */
async function verify(entityId, verificationCode) {

  // Get company ID for entity
  const companyEntityId = await getPrimaryCompany(entityId);
  if(!companyEntityId) {
    throw {name : 'NoCompanyError'};
  }

  // Verify with code
  const res = await crmVerification.findMany({
    entity_id : entityId,
    company_entity_id : companyEntityId,
    verification_code : verificationCode,
    date_verified : null,
    method : 'post'
  });
  if(res.error) {
    throw res.error;
  }
  if(res.data.length !== 1) {
    throw {name : 'VerificationNotFoundError'};
  }
  const { verification_id, company_entity_id } = res.data[0];

  // Update document headers
  const res2 = await crmDocuments.updateMany({verification_id}, {company_entity_id, verified : 1});

  // Update verification record
  const res3 = await crmVerification.updateOne(verification_id, {date_verified : moment().format()});

  return {error: null, data : {verification_id}};

}


module.exports = {
  verification : crmVerification,
  documents : crmDocuments,
  entities : crmEntities,
  entityRoles : crmEntityRoles,
  getOutstandingLicenceRequests,
  createVerification,
  getOrCreateCompanyEntity,
  verify

}
