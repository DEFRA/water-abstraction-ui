
/**
 * HAPI Route handlers for registering a user account
 * @TODO give user choice of addresses if multiple returned
 *
 * @module controllers/registration
 */
const Boom = require('boom');
const Joi = require('joi');
const find = require('lodash/find');
const errorHandler = require('../lib/error-handler');
const View = require('../lib/view');
const joiPromise = require('../lib/joi-promise');
const IDM = require('../lib/connectors/idm');
const CRM = require('../lib/connectors/crm');
const Notify = require('../lib/connectors/notify');
const {forceArray} = require('../lib/helpers');



const {checkLicenceSimilarity, extractLicenceNumbers, uniqueAddresses} = require('../lib/licence-helpers');

/**
 * Render form to add licences to account
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function getLicenceAdd(request, reply) {
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
    licence_no : Joi.string().required().allow('').trim().max(9000)
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
      const res = await CRM.documents.findMany({
        system_external_id : licenceNumbers, verified : null, verification_id : null
      });
      if(res.error) {
        throw res.error;
      }

      // Check 1+ licences found
      if(res.data.length < 1) {
        throw {name : 'LicenceNotFoundError', details : [{message : 'No licence numbers could be found', path : 'licence_no'}]};
      }

      // Check # of licences returned = that searched for
      if(res.data.length != licenceNumbers.length) {
        throw {name : 'LicenceMissingError', details : [{message : 'Not all the licences could be found', path : 'licence_no'}]};
      }

      // Check licences are similar
      const similar = checkLicenceSimilarity(res.data);
      if(!similar) {
        throw {name : 'LicenceSimilarityError', details : [{message : 'The licences failed an affinity check', path : 'licence_no'}]};
      }

      viewContext.licences = res.data;

      // Seal the list of permitted licence numbers into a token
      // to prevent validation needing to be repeated on following step
      const documentIds = res.data.map(item => item.document_id);

      // Store document IDs in session
      const sessionData = await request.sessionStore.load();
      sessionData.addLicenceFlow = {documentIds};
      await request.sessionStore.save(sessionData);

      reply.redirect('/select-licences');
  }
  catch (err) {
    console.log(err);
    if(['ValidationError', 'LicenceNotFoundError', 'LicenceMissingError', 'LicenceSimilarityError'].includes(err.name)) {
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

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Select Licences';

  if(request.query.error === 'noLicenceSelected') {
    viewContext.error = {name : 'LicenceNotSelectedError'};
  }

  try {

    const { addLicenceFlow } = await request.sessionStore.load();
    const { documentIds } = addLicenceFlow;

    // Get unverified licences from DB
    const {data, error} = await CRM.documents.findMany({ document_id : documentIds, verified : null, verification_id : null }, { system_external_id : +1});

    if(error) {
      throw error;
    }

    viewContext.licences = data;
    viewContext.token = request.query.token;
    return reply.view('water/licences-add/select-licences', viewContext);

  }
  catch (err) {
    reply.redirect('/add-licences?error=flow');
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

    const sessionData = await request.sessionStore.load();
    const { documentIds } = sessionData.addLicenceFlow;

    const selectedIds = verifySelectedLicences(documentIds, licences);

    // Create new token
    sessionData.addLicenceFlow = {
      documentIds,
      selectedIds
    };
    await request.sessionStore.save(sessionData);

    reply.redirect('/select-address');
  }
  catch (err) {

    console.log(err);
    if(err.name === 'NoLicencesSelectedError') {
      return reply.redirect('/select-licences?error=noLicenceSelected');
    }
    errorHandler(request, reply)(err);
  }

}


/**
 * There has been an error uploading/selecting licences
 * - show user contact information
 * @param {Object} request - HAPI HTTP request instance
 * @param {Object} reply - HAPI HTTP reply instance
 */
function getLicenceSelectError(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Contact Us';
  return reply.view('water/licences-add/select-licences-error', viewContext);
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

  if(request.query.error === 'invalidAddress') {
    viewContext.error = {name : 'AddressInvalidError'};
  }

  try {
    // Load from session
    const {addLicenceFlow} = await request.sessionStore.load();
    const {documentIds, selectedIds} = addLicenceFlow;

    // Find licences in CRM for selected documents
    const { data } = await CRM.documents.findMany({document_id : selectedIds});

    const uniqueAddressLicences = uniqueAddresses(data);

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
    const { address } = request.payload;
    const { entity_id } = request.auth.credentials;

    try {

      // Load session data
      const sessionData = await request.sessionStore.load();
      const {documentIds, selectedIds} = sessionData.addLicenceFlow;

      // Ensure address present in list of document IDs in data
      if(!selectedIds.includes(address)) {
        throw {name : 'InvalidAddressError'};
      }

      // Find licences in CRM for selected documents
      const { data : licenceData, error : licenceError } = await CRM.documents.findMany({document_id : selectedIds});
      if(licenceError) {
        throw licenceError;
      }

      // Get company entity ID for current user
      const companyEntityId = await CRM.getOrCreateCompanyEntity(entity_id, licenceData[0].metadata.Name);

      // Create verification
      const verification = await CRM.createVerification(entity_id, companyEntityId, selectedIds);

      // Get the licence containing the selected verification address
      const { error, data } = await CRM.documents.findOne(address);
      if(error) {
        throw error;
      }

      // Post letter
      const result = await Notify.sendSecurityCode(data, verification.verification_code);

      // Get all licences - this is needed to determine whether to display link back to dashboard
      const { error: err2, data: licences} = await CRM.documents.getLicences({verified : 1, entity_id});
      if(err2) {
        throw err2;
      }

      // Delete data in session
      delete sessionData.addLicenceFlow;
      await request.sessionStore.save(sessionData);

      const viewContext = View.contextDefaults(request);
      viewContext.pageTitle = 'GOV.UK - Security Code Sent';
      viewContext.verification = verification;
      viewContext.licence = data;
      viewContext.licenceCount = licences.length;
      viewContext.showCode = !(process.env.NODE_ENV || '').match(/^production|preprod$/i);

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
function verifySelectedLicences(documentIds, requestDocumentIds) {

  requestDocumentIds = forceArray(requestDocumentIds);

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
 * Verify licences with code received in post
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function getSecurityCode(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Enter your security code';

  const {entity_id} = request.auth.credentials;

  try {
    viewContext.licences = await CRM.getOutstandingLicenceRequests(entity_id);
    return reply.view('water/licences-add/security-code', viewContext);
  }
  catch(error) {
    console.error(error);
    errorHandler(request, reply)(error);
  }
}


/**
 * Post handler for auth code form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function postSecurityCode(request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'GOV.UK - Enter your security code';

  const {entity_id} = request.auth.credentials;

  try {

    // Validate HTTP POST payload
    const schema = {
        verification_code : Joi.string().length(5).required()
    };
    const {error, value} = Joi.validate(request.payload, schema);

    if(error) {
      throw error;
    }

    // Verify
    const response = await CRM.verify(entity_id, request.payload.verification_code);

    // Licences have been verified if no error thrown
    return reply.redirect('/licences');
  }
  catch(error) {

    console.error(error);

    // Verification code invalid
    if(['VerificationNotFoundError', 'ValidationError'].includes(error.name)) {
      viewContext.licences = await _getOutstandingLicenceRequests(entity_id);
      viewContext.error = error;
      return reply.view('water/licences-add/security-code', viewContext);
    }

    errorHandler(request, reply)(error);
  }
}


module.exports = {
  getLicenceAdd,
  postLicenceAdd,
  getLicenceSelect,
  postLicenceSelect,
  getLicenceSelectError,
  getAddressSelect,
  postAddressSelect,
  getSecurityCode,
  postSecurityCode
};
