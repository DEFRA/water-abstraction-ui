/**
 * HAPI Route handlers for registering a user account
 * @TODO give user choice of addresses if multiple returned
 *
 * @module controllers/registration
 */
const Joi = require('joi');
const { difference } = require('lodash');
const errorHandler = require('../lib/error-handler');
const View = require('../lib/view');
const CRM = require('../lib/connectors/crm');
const Notify = require('../lib/connectors/notify');
const { forceArray } = require('../lib/helpers');

const { checkLicenceSimilarity, checkNewLicenceSimilarity, extractLicenceNumbers, uniqueAddresses } = require('../lib/licence-helpers');

const {
  LicenceNotFoundError,
  LicenceMissingError,
  LicenceSimilarityError,
  InvalidAddressError,
  NoLicencesSelectedError,
  LicenceFlowError
} = require('./licences-add-errors');

/**
 * Render form to add licences to account
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function getLicenceAdd (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Which licences do you want to be able to view?';
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
async function postLicenceAdd (request, reply) {
  // @TODO relevant validation messages

  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Which licences do you want to be able to view?';
  viewContext.activeNavLink = 'manage';

  // Validate posted data
  const schema = {
    licence_no: Joi.string().required().allow('').trim().max(9000),
    csrf_token: Joi.string().guid()
  };
  try {
    // Validate post data
    const { error, value } = Joi.validate(request.payload, schema);
    if (error) {
      throw error;
    }

    // Get list of licence numbers from supplied data
    const licenceNumbers = extractLicenceNumbers(value.licence_no);
    if (licenceNumbers.length < 1) {
      throw new LicenceNotFoundError();
    }

    const res = await CRM.documents.getUnregisteredLicences(licenceNumbers);

    if (res.error) {
      throw res.error;
    }

    // Check 1+ licences found
    if (res.data.length < 1) {
      viewContext.missingNumbers = {};
      viewContext.missingNumbers.data = licenceNumbers.join(', ');
      viewContext.missingNumbers.length = licenceNumbers.length;
      throw new LicenceNotFoundError();
    }

    // Check # of licences returned = that searched for
    if (res.data.length !== licenceNumbers.length) {
      const missingNumbers = difference(licenceNumbers, res.data.map(item => item.system_external_id));
      viewContext.missingNumbers = {};
      viewContext.missingNumbers.data = missingNumbers.join(', ');
      viewContext.missingNumbers.length = licenceNumbers.length;
      throw new LicenceMissingError(`Not all the licences could be found (missing ${missingNumbers})`);
    }

    // Check licences are similar
    const similar = checkLicenceSimilarity(res.data);
    if (!similar) {
      throw new LicenceSimilarityError();
    }

    viewContext.licences = res.data;

    // Seal the list of permitted licence numbers into a token
    // to prevent validation needing to be repeated on following step
    const documentIds = res.data.map(item => item.document_id);

    // Store document IDs in session
    request.sessionStore.set('addLicenceFlow', { documentIds });

    reply.redirect('/select-licences');
  } catch (err) {
    console.log(err);
    if (['ValidationError', 'LicenceNotFoundError', 'LicenceMissingError', 'LicenceSimilarityError'].includes(err.name)) {
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
async function getLicenceSelect (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Are these the licences you want to be able to view?';
  viewContext.activeNavLink = 'manage';

  if (request.query.error === 'noLicenceSelected') {
    viewContext.error = { name: 'LicenceNotSelectedError' };
  }

  try {
    const { documentIds } = request.sessionStore.get('addLicenceFlow');

    // Get unverified licences from DB
    const { data, error } = await CRM.documents.getUnregisteredLicencesByIds(documentIds);

    if (error) {
      throw error;
    }

    viewContext.licences = data;
    viewContext.token = request.query.token;
    return reply.view('water/licences-add/select-licences', viewContext);
  } catch (err) {
    reply.redirect('/add-licences?error=flow');
  }
}

/**
 * Post handler for licence select
 * User must select
 * - at least one licence
 * - licences must be from verified list
 * - @todo if affinity with existing licences, add without verification
 *
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.payload.token - signed Iron token containing licence info
 * @param {Array|String} request.payload.licences - array of licences selected (or string if 1)
 * @param {Object} reply - HAPI HTTP reply
 */
async function postLicenceSelect (request, reply) {
  const { licences } = request.payload;
  const { entity_id: entityId } = request.auth.credentials;

  try {
    const { documentIds } = request.sessionStore.get('addLicenceFlow');

    const selectedIds = verifySelectedLicences(documentIds, licences);

    // Is there affinity between the selected licences and licences already attached
    // to this user's company where the user is the primary_user role?
    // If so, add the licences to the account directly skipping address verification
    const companyEntityId = await CRM.getPrimaryCompany(entityId);

    if (companyEntityId) {
      // Licences already in account
      const { data: existingLicences, error } = await CRM.documents.findMany({
        company_entity_id: companyEntityId,
        verified: 1
      });
      if (error) {
        throw error;
      }
      // Licences being added now
      const { data: selectedLicences, error: error2 } = await CRM.documents.findMany({
        document_id: { $or: documentIds },
        verified: null,
        verification_id: null
      });
      if (error2) {
        throw error2;
      }

      // Check affinity between existing/selected licences
      if (existingLicences.length > 0) {
        const similar = checkNewLicenceSimilarity(selectedLicences, existingLicences);
        if (similar) {
          const { error: error3 } = await CRM.documents.updateMany({ document_id: { $or: documentIds } }, {
            verified: 1,
            company_entity_id: companyEntityId
          });

          if (error3) {
            throw error3;
          }

          return reply.redirect('/licences');
        }
      }
    }

    // Create new token
    request.sessionStore.set('addLicenceFlow', { documentIds, selectedIds });

    reply.redirect('/select-address');
  } catch (err) {
    console.log(err);
    if (err.name === 'NoLicencesSelectedError') {
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
function getLicenceSelectError (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Sorry, we need to confirm your licence information with you';
  viewContext.customTitle = 'We need to confirm your licence information';
  viewContext.activeNavLink = 'manage';
  return reply.view('water/licences-add/select-licences-error', viewContext);
}

/**
 * Renders an HTML form for the user to select their address for postal
 * verification
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.query - GET query params
 * @param {String} request.query.token - signed Iron token containing all and selected licence IDs
 */
async function getAddressSelect (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Where should we send your security code?';
  viewContext.activeNavLink = 'manage';

  if (request.query.error === 'invalidAddress') {
    viewContext.error = { name: 'AddressInvalidError' };
  }

  try {
    // Load from session
    const { selectedIds } = request.sessionStore.get('addLicenceFlow');

    // Find licences in CRM for selected documents
    const { data } = await CRM.documents.findMany({ document_id: { $or: selectedIds } });

    const uniqueAddressLicences = uniqueAddresses(data);

    viewContext.licences = uniqueAddressLicences;

    return reply.view('water/licences-add/select-address', viewContext);
  } catch (err) {
    console.log(err);
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
async function postAddressSelect (request, reply) {
  const { address } = request.payload;
  const { entity_id: entityId } = request.auth.credentials;

  try {
    // Load session data
    const { selectedIds } = request.sessionStore.get('addLicenceFlow');

    // Ensure address present in list of document IDs in data
    if (!selectedIds.includes(address)) {
      throw new InvalidAddressError();
    }

    // Find licences in CRM for selected documents
    const { data: licenceData, error: licenceError } = await CRM.documents.findMany({ document_id: { $or: selectedIds } });
    if (licenceError) {
      throw licenceError;
    }

    // Get company entity ID for current user
    const companyEntityId = await CRM.getOrCreateCompanyEntity(entityId, licenceData[0].metadata.Name);

    // Create verification
    const verification = await CRM.createVerification(entityId, companyEntityId, selectedIds);

    // Get the licence containing the selected verification address
    const { error, data } = await CRM.documents.findOne(address);
    if (error) {
      throw error;
    }

    // Post letter
    await Notify.sendSecurityCode(data, verification.verification_code);

    // Get all licences - this is needed to determine whether to display link back to dashboard
    const { error: err2, data: licences } = await CRM.documents.getLicences({ verified: 1, entity_id: entityId });
    if (err2) {
      throw err2;
    }

    // Delete data in session
    request.sessionStore.delete('addLicenceFlow');

    const viewContext = View.contextDefaults(request);
    viewContext.pageTitle = `We are sending you a letter`;
    viewContext.activeNavLink = 'manage';
    viewContext.verification = verification;
    viewContext.licence = data;
    viewContext.licenceCount = licences.length;

    return reply.view('water/licences-add/verification-sent', viewContext);
  } catch (err) {
    if (err.name === 'InvalidAddressError') {
      return reply.redirect('/select-address?error=invalidAddress');
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
function verifySelectedLicences (documentIds, requestDocumentIds) {
  requestDocumentIds = forceArray(requestDocumentIds);

  if (requestDocumentIds.length < 1) {
    throw new NoLicencesSelectedError();
  };

  // Ensure all submitted licences are in token
  requestDocumentIds.forEach((documentId) => {
    if (!documentIds.includes(documentId)) {
      throw new LicenceFlowError();
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
async function getSecurityCode (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Enter your security code';
  viewContext.activeNavLink = 'manage';

  try {
    return reply.view('water/licences-add/security-code', viewContext);
  } catch (error) {
    console.error(error);
    errorHandler(request, reply)(error);
  }
}

/**
 * Post handler for auth code form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function postSecurityCode (request, reply) {
  const viewContext = View.contextDefaults(request);
  viewContext.pageTitle = 'Enter your security code';
  viewContext.activeNavLink = 'manage';

  const { entity_id: entityId } = request.auth.credentials;

  try {
    // Validate HTTP POST payload
    const schema = {
      verification_code: Joi.string().length(5).required(),
      csrf_token: Joi.string().guid()
    };
    const { error } = Joi.validate(request.payload, schema);

    if (error) {
      throw error;
    }

    // Verify
    await CRM.verify(entityId, request.payload.verification_code);

    // Licences have been verified if no error thrown
    return reply.redirect('/licences');
  } catch (error) {
    console.error(error);

    // Verification code invalid
    if (['VerificationNotFoundError', 'ValidationError'].includes(error.name)) {
      viewContext.licences = await CRM.getOutstandingLicenceRequests(entityId);
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
