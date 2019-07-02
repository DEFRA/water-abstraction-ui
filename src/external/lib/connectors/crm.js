/**
 * Provides convenience methods for HTTP API requests from the tactical CRM
 * @module lib/connectors/crm
 */
const moment = require('moment');

const services = require('./services');

/**
 * Gets a list of licences relating to outstanding verification
 * codes for the user with the individual entity specified
 * @param {String} entity_id - the individual entity ID
 * @return {Promise} resolves with array of licence document_header data
 */
// TODO: Move this to the water service because it crosses services
async function getOutstandingLicenceRequests (entityId) {
  // Get outstanding verifications for current user
  const res = await services.crm.verifications.findMany({
    entity_id: entityId,
    date_verified: null
  });
  if (res.error) {
    throw res.error;
  }

  // Get array list of verification IDs
  const verificationId = res.data.map(row => row.verification_id);

  // Find licences with this ID
  const { error, data } = await services.crm.documents.findMany({
    verification_id: verificationId
  });
  if (error) {
    throw error;
  }

  return data;
}

/**
 * Gets or creates a company entity for the supplied individual entity ID
 * where the user is the primary user
 * @param {String} entityId - the individual entity ID
 * @param {String} companyName - the name of the company entity
 * @return {Promise} resolves with company entity ID found/created
 */
// TODO: Move this to the water service because it crosses services
async function getOrCreateCompanyEntity (entityId, companyName) {
  const companyId = await services.crm.entityRoles.getPrimaryCompany(entityId);

  if (companyId) {
    return companyId;
  }

  // No role found, create new entity
  const { data, error } = await services.crm.entities.create({ entity_nm: companyName, entity_type: 'company' });

  if (error) {
    throw error;
  }

  // Create entity role
  const { error: roleError } = await services.crm.entityRoles.setParams({ entityId }).create({
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
// TODO: Move this to the water service because it crosses services
async function verify (entityId, verificationCode) {
  // Get company ID for entity
  const companyEntityId = await services.crm.entityRoles.getPrimaryCompany(entityId);
  if (!companyEntityId) {
    throw new NoCompanyError();
  }

  // Verify with code
  const res = await services.crm.verifications.findMany({
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
  const res2 = await services.crm.verifications.getDocuments(verificationId);
  if (res2.error) {
    throw res2.error;
  }
  const documentIds = res2.data.map(row => row.document_id);

  // Update document headers
  const res3 = await services.crm.documents.updateMany(
    { document_id: { $in: documentIds }, company_entity_id: null },
    { verification_id: verificationId, company_entity_id: companyEntityId }
  );
  if (res3.error) {
    throw res3.error;
  }

  // Update verification record
  const res4 = await services.crm.verifications.updateOne(verificationId, { date_verified: moment().format() });
  if (res4.error) {
    throw res4.error;
  }

  return { error: null, data: { verification_id: verificationId } };
}

exports.getOutstandingLicenceRequests = getOutstandingLicenceRequests;
exports.getOrCreateCompanyEntity = getOrCreateCompanyEntity;
exports.verify = verify;
