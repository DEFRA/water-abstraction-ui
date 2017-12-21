
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
const {forceArray} = require('../lib/helpers');

// Create promisified versions of Iron seal/unseal
const ironSeal = Bluebird.promisify(Iron.seal);
const ironUnseal = Bluebird.promisify(Iron.unseal);

const {checkLicenceSimilarity, extractLicenceNumbers, uniqueAddresses} = require('../lib/licence-helpers');

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
 * If checks pass, redirects to select licence screen, otherwise
 * re-render form with errors
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - form POST
 * @param {String} request.payload.licence_no - user-entered licence numbers
 * @param {Object} reply - HAPI HTTP reply
 */
async function postLicenceAdd(request, reply) {

  // @TODO relevant validation messages

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Add Licence';

  // Validate posted data
  const schema = {
    licence_no : Joi.string().required().allow('').trim().max(6000)
  };
  try {
      // Validate post data
      const {error, value} = Joi.validate(request.payload, schema);
      if(error) {
        throw error;
      }

      // Get list of licence numbers from supplied data
      const licenceNumbers = extractLicenceNumbers(value.licence_no);
      if(licenceNumbers.length < 1) {
        throw {name : 'ValidationError', details : [{message : 'No licence numbers submitted'}]};
      }

      // Get unverified licences from DB
      const res = await CRM.getLicences({ system_external_id : licenceNumbers, verified : null, verification_id : null }, {}, false);
      if(res.error) {
        throw res.error;
      }

      // Check 1+ licences found
      if(res.data.length < 1) {
        throw {name : 'ValidationError', details : [{message : 'No licence numbers could be found', path : 'licence_no'}]};
      }

      // Check # of licences returned = that searched for
      if(res.data.length != licenceNumbers.length) {
        throw {name : 'ValidationError', details : [{message : 'Not all the licences could be found', path : 'licence_no'}]};
      }

      // Check licences are similar
      const similar = checkLicenceSimilarity(res.data);
      if(!similar) {
        throw {name : 'ValidationError', details : [{message : 'The licences failed an integrity check', path : 'licence_no'}]};
      }

      viewContext.licences = res.data;

      // Seal the list of permitted licence numbers into a token
      // to prevent validation needing to be repeated on following step
      const documentIds = res.data.map(item => item.document_id);
      const token =  await ironSeal({documentIds}, process.env.cookie_secret, Iron.defaults);

      reply.redirect('/select-licences?token=' + token);
  }
  catch (err) {
    console.log(err);
    if(err.name === 'ValidationError') {
      viewContext.error = err;
      return reply.view('water/licences-add/add-licences', viewContext);
    }
    errorHandler(request, reply)(err);
  }

}



/**
 * Select licences to add in this verification step
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.query.token - the Iron encoded token
 * @param {Object} reply - HAPI HTTP reply
 */
async function getLicenceSelect(request, reply) {
  const { documentIds } = await ironUnseal(request.query.token, process.env.cookie_secret, Iron.defaults);

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Select Licences';

  try {
    // Get unverified licences from DB
    const {data, error} = await CRM.getLicences({ document_id : documentIds, verified : null, verification_id : null }, {}, false);

    if(error) {
      throw error;
    }

    viewContext.licences = data;
    viewContext.token = request.query.token;
    return reply.view('water/licences-add/select-licences', viewContext);

  }
  catch (err) {
    console.log(err);
    reply.redirect('/add-licences?error=token');
  }

}

/**
 * Post handler for licence select
 * User must select
 * - at least one licence
 * - licences must be from verified list
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.token - signed Iron token containing licence info
 * @param {Array|String} request.payload.licences - array of licences selected (or string if 1)
 * @param {Object} reply - HAPI HTTP reply
 */
async function postLicenceSelect(request, reply) {

  const { token, licences } = request.payload;

  try {

    const { documentIds } = await ironUnseal(token, process.env.cookie_secret, Iron.defaults);

    const selectedIds = await _verifyTokenRequest(token, licences);

    // Create new token
    const newToken = await ironSeal({documentIds, selectedIds}, process.env.cookie_secret, Iron.defaults);
    reply.redirect('/select-address?token=' + newToken);
  }
  catch (err) {

    console.log(err);
    if(err.name === 'NoLicencesSelectedError') {
      return reply.redirect('/select-licences?error=noLicencesSelected&token=' + token);
    }
    errorHandler(request, reply)(err);
  }

}



/**
 * Renders an HTML form for the user to select their address for postal
 * verification
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.query - GET query params
 * @param {String} request.query.token - signed Iron token containing all and selected licence IDs
 */
async function getAddressSelect(request, reply) {

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Choose Address';

  try {
    // Decode the Iron token
    const { token } = request.query;
    const {documentIds, selectedIds} = await ironUnseal(token, process.env.cookie_secret, Iron.defaults);

    // Find licences in CRM for selected documents
    const { data } = await CRM.getLicences({document_id : selectedIds}, {}, false);

    const uniqueAddressLicences = uniqueAddresses(data);

    viewContext.token = token;
    viewContext.licences = uniqueAddressLicences;

    return reply.view('water/licences-add/select-address', viewContext);

  }
  catch(err) {
    errorHandler(request, reply)(err);
  }

}


/**
 * Post handler for select address form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - HTTP POST request params
 * @param {String} request.payload.token - signed Iron token containing all and selected licence IDs
 * @param {String} request.payload.address - documentId for licence with address for post verify
 * @param {Object} reply - HAPI HTTP reply
 */
async function postAddressSelect(request, reply) {
    const { token, address } = request.payload;
    const {entity_id} = request.auth.credentials;

    try {
      const {documentIds, selectedIds} = await ironUnseal(token, process.env.cookie_secret, Iron.defaults);

      // Ensure address present in list of document IDs in token
      if(!selectedIds.includes(address)) {
        throw {name : 'InvalidAddressError'};
      }

      // Get company entity ID for current user
      const companyEntityId = await _getOrCreateCompanyEntity(entity_id);

      // Create verification
      const verification = await _createVerification(entity_id, companyEntityId, selectedIds);


      const viewContext = View.contextDefaults(request);
      viewContext.pageTitle = 'GOV.UK - Security Code Sent';
      viewContext.verification = verification;
      return reply.view('water/licences-add/verification-sent', viewContext);
    }
    catch (err) {

      if(err.name === 'InvalidAddressError') {
        return reply.redirect('/select-address?error=invalidAddress&token=' + token);
      }

      errorHandler(request, reply)(err);
    }
}

/**
 * Verifies the request
 * A token and a list of licences have been provided
 * throws error if a licence number has been submitted that is not
 * included in the token generated at the start of the flow
 * @param {String} token - the request token
 * @param {Array|String} requestDocumentIds - a single licence doc ID or list of doc IDs
 * @return {Array} - list of doc IDs that were included in the token
 */
async function _verifyTokenRequest(token, requestDocumentIds) {

  requestDocumentIds = forceArray(requestDocumentIds);

  // Decode the Iron token
  const { documentIds } = await ironUnseal(token, process.env.cookie_secret, Iron.defaults);

  if(requestDocumentIds.length < 1) {
    throw {name : 'NoLicencesSelectedError', details : [{ message : 'No licences selected'}]}
  };

  // Ensure all submitted licences are in token
  requestDocumentIds.forEach((documentId) => {
    if(!documentIds.includes(documentId)) {
      throw {name : 'TokenError', details : [{ message : 'Licence/token mismatch'}]};
    }
  });

  // Return licences
  return requestDocumentIds;
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

}


module.exports = {
  getLicenceAdd,
  postLicenceAdd,
  getLicenceSelect,
  postLicenceSelect,
  getAddressSelect,
  postAddressSelect,
  getSecurityCode,
  postSecurityCode
};
