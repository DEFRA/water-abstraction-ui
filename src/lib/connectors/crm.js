/**
 * Provides convenience methods for HTTP API requests from the tactical CRM
 * @module lib/connectors/crm
 */
const moment = require('moment');
const find = require('lodash/find');

const crmVerification = require('./crm/verification');
const crmEntities = require('./crm/entities');
const crmDocuments = require('./crm/documents');
const crmEntityRoles = require('./crm/entity-roles');
const crmDocumentVerification = require('./crm/document-verification');

/**
 * Gets a list of licences relating to outstanding verification
 * codes for the user with the individual entity specified
 * @param {String} entity_id - the individual entity ID
 * @return {Promise} resolves with array of licence document_header data
 */
async function getOutstandingLicenceRequests (entityId) {
  // Get outstanding verifications for current user
  const res = await crmVerification.findMany({
    entity_id: entityId,
    date_verified: null
  });
  if (res.error) {
    throw res.error;
  }

  // Get array list of verification IDs
  const verificationId = res.data.map(row => row.verification_id);

  // Find licences with this ID
  const {error, data} = await crmDocuments.findMany({
    verification_id: verificationId,
    verified: null
  });
  if (error) {
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
async function createVerification (entityId, companyEntityId, documentIds) {
  const verificationData = {
    entity_id: entityId,
    company_entity_id: companyEntityId,
    method: 'post'
  };

  const res = await crmVerification.create(verificationData);

  if (res.error) {
    throw res.error;
  }

  const { verification_id: verificationId } = res.data;

  const res2 = await crmVerification.addDocuments(verificationId, documentIds);

  if (res2.error) {
    throw res2.error;
  }

  return res.data;
}

/**
 * Gets primary company for current user
 * @TODO assumes on only 1 company per user - may not be the case
 * @param {String} entityId - the individual entity ID
 * @return {Promise} resolves with company entity ID found
 */
async function getPrimaryCompany (entityId) {
  const res = await crmEntityRoles.setParams({entityId}).findMany({
    role: 'primary_user'
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
async function getOrCreateCompanyEntity (entityId, companyName) {
  const companyId = await getPrimaryCompany(entityId);

  if (companyId) {
    return companyId;
  }

  // No role found, create new entity
  const { data, error } = await crmEntities.create({entity_nm: companyName, entity_type: 'company'});

  if (error) {
    throw error;
  }

  // Create entity role
  const { error: roleError } = await crmEntityRoles.setParams({entityId}).create({
    company_entity_id: data.entity_id,
    role: 'primary_user'
  });

  if (roleError) {
    throw roleError;
  }

  return data.entity_id;
}

/**
 * Error class for when no company is found for the user during verification
 * process
 */
class NoCompanyError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NoCompanyError';
  }
}

/**
 * Error class for when security code cannot be found in DB
 */
class VerificationNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'VerificationNotFoundError';
  }
}

/**
 * Verification process
 * @param {String} entityId - the individual entity ID
 * @param {String} verificationCode - the code supplied by post
 * @return {Promise} resolves if verification successful
 */
async function verify (entityId, verificationCode) {
  // Get company ID for entity
  const companyEntityId = await getPrimaryCompany(entityId);
  if (!companyEntityId) {
    throw new NoCompanyError();
  }

  // Verify with code
  const res = await crmVerification.findMany({
    entity_id: entityId,
    company_entity_id: companyEntityId,
    verification_code: verificationCode,
    date_verified: null,
    method: 'post'
  });
  if (res.error) {
    throw res.error;
  }
  if (res.data.length !== 1) {
    throw new VerificationNotFoundError();
  }
  const { verification_id: verificationId } = res.data[0];

  // Get list of documents for this verification
  const res2 = await crmVerification.getDocuments(verificationId);
  if (res2.error) {
    throw res2.error;
  }
  const documentIds = res2.data.map(row => row.document_id);

  // Update document headers
  const res3 = await crmDocuments.updateMany(
    {document_id: {$in: documentIds}, company_entity_id: null, verified: null},
    {verification_id: verificationId, company_entity_id: companyEntityId, verified: 1}
  );
  if (res3.error) {
    throw res3.error;
  }

  // Update verification record
  const res4 = await crmVerification.updateOne(verificationId, {date_verified: moment().format()});
  if (res4.error) {
    throw res4.error;
  }

  return {error: null, data: {verification_id: verificationId}};
}


/**
 * Gets a list of verification codes and entity_nm values relating to documents
 * @param {String} document_id - the document header ID
 * @return {Promise} resolves with array of verification data
 */
async function getDocumentVerifications (document_id) {
  // Get verifications for document
  const {error, data} =  await crmDocumentVerification.getDocumentVerifications(document_id);

  //sort by date
  data.sort(function(a,b){
  return new Date(b.date_created) - new Date(a.date_created);
  });

  //kludge a unique key on entity_id and document
  data.map((verification) => {
      verification.key = verification.entity_id+'.'+verification.document_id;
      return verification;
  })

  //dedupe on key
const deduped=removeDuplicates(data,'key')

  if (error) {
    throw error;
  }

  return deduped;
}

function removeDuplicates(arr, key) {
    if (!(arr instanceof Array) || key && typeof key !== 'string') {
        return false;
    }

    if (key && typeof key === 'string') {
        return arr.filter((obj, index, arr) => {
            return arr.map(mapObj => mapObj[key]).indexOf(obj[key]) === index;
        });

    } else {
        return arr.filter(function(item, index, arr) {
            return arr.indexOf(item) == index;
        });
    }
}
module.exports = {
  verification: crmVerification,
  documents: crmDocuments,
  entities: crmEntities,
  entityRoles: crmEntityRoles,
  getOutstandingLicenceRequests,
  createVerification,
  getOrCreateCompanyEntity,
  getPrimaryCompany,
  verify,
  getDocumentVerifications

};
