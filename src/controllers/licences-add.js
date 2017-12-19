
/**
 * HAPI Route handlers for registering a user account
 * @TODO give user choice of addresses if multiple returned
 *
 * @module controllers/registration
 */
const Boom = require('boom');
const Joi = require('joi');
const Iron = require('iron');
const Bluebird = require('bluebird');
const find = require('lodash/find');
const errorHandler = require('../lib/error-handler');
const View = require('../lib/view');
const joiPromise = require('../lib/joi-promise');
const IDM = require('../lib/connectors/idm');
const CRM = require('../lib/connectors/crm');

// Create promisified versions of Iron seal/unseal
const ironSeal = Bluebird.promisify(Iron.seal);
const ironUnseal = Bluebird.promisify(Iron.unseal);

const {checkLicenceSimilarity, extractLicenceNumbers} = require('../lib/licence-helpers');

/**
 * Render form to add licences to account
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getLicenceAdd(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';
  return reply.view('water/licences-add/add-licences', viewContext);
}



/**
 * Post handler for adding licences
 * Need to:
 * - extract licence numbers from supplied text
 * - get licence numbers from CRM
 * - Check address / licence holder name consistency
 * - create verification step
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form POST
 * @param {String} request.payload.licence_no - user-entered licence numbers
 * @param {Object} reply - HAPI HTTP reply
 */
function postLicenceAdd(request, reply) {

  // @TODO handle error conditions:
  // Not all licences matched
  // None found
  // Disparity between licence data

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';

  // Get list of licence numbers from supplied data
  const licenceNumbers = extractLicenceNumbers(request.payload.licence_no);

  // Validate posted data
  const schema = {
    licence_no : Joi.string().required().allow('').max(6000)
  };
  joiPromise(request.payload, schema)
    .then((value) => {
      // Extract licence numbers from string
      if(licenceNumbers.length < 1) {
        throw {name : 'ValidationError'};
      }
      // Get unverified licences from DB
      return CRM.getLicences({ system_external_id : licenceNumbers, verified : null, verification_id : null });
    })
    .then((res) => {

      console.log(res);

      // Check 1+ licences found
      if(res.data.length < 1) {
        throw {name : 'ValidationError', details : [{message : 'No licence numbers submitted', path : 'licence_no'}]};
      }

      // Check # of licences returned = that searched for
      if(res.data.length != licenceNumbers.length) {
        throw {name : 'ValidationError', details : [{message : 'Not all the licences could be found', path : 'licence_no'}]};
      }

      // Check licences are similar
      const similar = checkLicenceSimilarity(res.data);
      if(!similar) {
        throw {name : 'ValidationError', detaiuls : [{message : 'The licences failed an integrity check', path : 'licence_no'}]};
      }

      viewContext.licences = res.data;

      // Seal the list of permitted licence numbers into a token
      // to prevent validation needing to be repeated on following step
      const documentIds = res.data.map(item => item.document_id);
      return ironSeal({documentIds}, process.env.cookie_secret, Iron.defaults);

    })
    .then((token) => {
      viewContext.token = token;
      return reply.view('water/licences-add/select-licences', viewContext);
    })
    .catch((err) => {
      if(err.name === 'ValidationError') {
        console.log(err);
        viewContext.error = err;
        return reply.view('water/licences-add/add-licences', viewContext);
      }
      throw err;
    })
    .catch(errorHandler(request, reply));


}



/**
 * Gets primary company for current user
 * @TODO assumes on only 1 company per user - may not be the case
 * @param {String} entityId - the individual entity ID
 * @return {Promise} resolves with company entity ID found
 */
async function _getPrimaryCompany(entityId) {

  const res = await CRM.getEntityRoles(entityId);

  // Find role in list
  const role = find(res.data, (role) => {
    return role.company_entity_id && role.is_primary;
  });

  return role ? role.company_entity_id : null;

}


/**
 * Gets or creates a company entity for the supplied individual entity ID
 * where the user is the primary user
 * @param {String} entityId - the individual entity ID
 * @return {Promise} resolves with company entity ID found/created
 */
async function _getOrCreateCompanyEntity(entityId) {

  const companyId = _getPrimaryCompany(entityId);

  if(companyId) {
    return companyId;
  }

  // No role found, create new entity
  const { data } = await CRM.createEntity('', 'company');

  // Create entity role
  const res3 = await CRM.addEntityRole(entityId, data.entity_id, 'user', true);

  return data.entity_id;
}


/**
 * Creates a new verification for the supplied combination of
 * individual, company, and a list of document header IDs
 * @param {String} entityId - the individual entity ID
 * @param {String} companyEntityId - the company entity ID
 * @param {Array} documentIds - a list of document IDs to create the verification for
 * @return {Promise} resolves with {verification_id, verification_code}
 */
async function _createVerification(entityId, companyEntityId, documentIds) {

  const res = await CRM.createVerification(entityId, companyEntityId);

  const {verification_id, verification_code} = res.data;

  const res2 = await CRM.updateDocumentHeaders({document_id : documentIds}, {verification_id});

  return res.data;
}


/**
 * Validates the requested set of document IDs to verify
 * @param {String} token - a sealed object created with Iron, contains list of validated document IDs
 * @param {Array} documentIds - the user-requested list of document IDs to verify
 * @return {Promise} resolves if valid request
 */
async function _validateRequest(token, documentIds) {

  // Check >0 licences selected
  if(documentIds.length < 1) {
    throw {name : 'ValidationError', details : [{message : 'No licences were selected', path : 'licences'}]};
  };

  // Unseal Iron token
  const data = await ironUnseal(token, process.env.cookie_secret, Iron.defaults);

  // Check all posted licences were in sealed token
  documentIds.forEach((documentId) => {
    if(data.documentIds.indexOf(documentId) === -1) {
      throw {name : 'ValidationError', details : [{message : 'Licence/token error', path : 'licences'}]};
    }
  });

  return documentIds;
};



/**
 * Post handler for confirming licences to add
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form POST data
 * @param {Array} request.payload.licences - array of CRM documentIds for licences user wishes to add
 * @param {String} request.payload.token - a token created with Iron containing list of licence doc IDs from previous step
 * @param {Object} reply - HAPI HTTP reply
 */
function postConfirmLicences(request, reply) {

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';

  const {entity_id} = request.auth.credentials;
  const {licences, token} = request.payload;

  _validateRequest(token, licences)
    .then(() => {
      return _getOrCreateCompanyEntity(entity_id);
    })
    .then((companyEntityId) => {
      return _createVerification(entity_id, companyEntityId, licences);
    })
    .then((verification) => {
      viewContext.verification = verification;
      return reply.view('water/licences-add/verification-sent', viewContext);
    })
    .catch(errorHandler(request, reply));

}

/**
 * Verify licences with code received in post
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function getSecurityCode(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Enter your security code';
  return reply.view('water/licences-add/security-code', viewContext);
}



/**
 * Verification process
 * @param {String} entityId - the individual entity ID
 * @param {String} verificationCode - the code supplied by post
 * @return {Promise} resolves if verification successful
 */
async function _verify(entityId, verificationCode) {

  // Get company ID for entity
  const companyEntityId = await _getPrimaryCompany(entityId);
  if(!companyEntityId) {
    throw {name : 'NoCompanyError'};
  }

  // Verify with code
  const res = await CRM.checkVerification(entityId, companyEntityId, verificationCode);
  const { verification_id, company_entity_id } = res.data;

  // Update document headers
  const res2 = await CRM.updateDocumentHeaders({verification_id}, {company_entity_id, verified : 1});

  // Update verification record
  const res3 = await CRM.completeVerification(verification_id);

  return {error: null, data : {verification_id}};

}

/**
 * Post handler for auth code form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
function postSecurityCode(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Enter your security code';

  const {entity_id} = request.auth.credentials;

  const schema = {
      verification_code : Joi.string().min(5).max(5)
  };

  joiPromise(request.payload, schema)
    .then((value) => {
      // Verify
      return _verify(entity_id, request.payload.verification_code);
    })
    .then((res) => {
      // Licences have been verified
      return reply.redirect('/licences');
    })
    .catch((err) => {

      // Verification code invalid
      if(err.name === 'StatusCodeError' && err.statusCode === 401) {
        viewContext.error = err;
        return reply.view('water/licences-add/security-code', viewContext);
      }

      // Invalid security code
      if(err.name === 'ValidationError') {
        viewContext.error = err;
        return reply.view('water/licences-add/security-code', viewContext);
      }
      throw err;
    })
    .catch(errorHandler(request, reply));


  // CRM.checkVerification(entity_id, company_entity_id, verification_code)
}


module.exports = {
  getLicenceAdd,
  postLicenceAdd,
  postConfirmLicences,
  getSecurityCode,
  postSecurityCode
};
