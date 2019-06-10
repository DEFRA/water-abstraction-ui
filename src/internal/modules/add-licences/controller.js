/**
 * HAPI Route handlers for registering a user account
 * @TODO give user choice of addresses if multiple returned
 *
 * @module controllers/registration
 */
const Joi = require('joi');
const { difference } = require('lodash');
const CRM = require('../../lib/connectors/crm');
const Notify = require('../../lib/connectors/notify');
const { forceArray } = require('../../lib/helpers');
const { logger } = require('../../logger');
const loginHelpers = require('../../lib/login-helpers');
const { throwIfError } = require('@envage/hapi-pg-rest-api');
const {
  checkLicenceSimilarity,
  checkNewLicenceSimilarity,
  extractLicenceNumbers,
  uniqueAddresses
} = require('../../../shared/lib/licence-helpers');
const forms = require('../../../shared/lib/forms');
const { faoForm, faoSchema } = require('./forms/for-attention-of');
const { selectAddressForm, selectAddressSchema } = require('./forms/select-address');

const {
  LicenceNotFoundError,
  LicenceMissingError,
  LicenceSimilarityError,
  NoLicencesSelectedError,
  LicenceFlowError
} = require('./errors');

/**
 * Render form to add licences to account
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function getLicenceAdd (request, reply) {
  const viewContext = request.view;
  viewContext.activeNavLink = 'manage';
  viewContext.pageTitle = 'Add your licences to the service';
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
  const viewContext = request.view;
  viewContext.pageTitle = 'Add your licences to the service';
  viewContext.activeNavLink = 'manage';

  // Validate posted data
  const schema = {
    licence_no: Joi.string().required().trim().max(9000),
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
    request.yar.set('addLicenceFlow', { documentIds });

    return reply.redirect('/select-licences');
  } catch (err) {
    logger.error('Add licence error', err);

    if (['ValidationError', 'LicenceNotFoundError', 'LicenceMissingError', 'LicenceSimilarityError'].includes(err.name)) {
      viewContext.error = err;
      return reply.view('water/licences-add/add-licences', viewContext);
    }
    throw err;
    // errorHandler(request, reply)(err);
  }
}

/**
 * Select licences to add in this verification step
 * @param {Object} request - HAPI HTTP request
 * @param {String} request.query.token - the Iron encoded token
 * @param {Object} reply - HAPI HTTP reply
 */
async function getLicenceSelect (request, reply) {
  const viewContext = request.view;
  viewContext.pageTitle = 'Confirm your licences';
  viewContext.activeNavLink = 'manage';

  if (request.query.error === 'noLicenceSelected') {
    viewContext.error = { name: 'LicenceNotSelectedError' };
  }

  try {
    const { documentIds } = request.yar.get('addLicenceFlow');

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
  const { entityId } = request.defra;

  try {
    const { documentIds } = request.yar.get('addLicenceFlow');

    const selectedIds = verifySelectedLicences(documentIds, licences);

    // Is there affinity between the selected licences and licences already attached
    // to this user's company where the user is the primary_user role?
    // If so, add the licences to the account directly skipping address verification
    const companyEntityId = await CRM.getPrimaryCompany(entityId);

    if (companyEntityId) {
      // Licences already in account
      const { data: existingLicences, error } = await CRM.documents.findMany({
        company_entity_id: companyEntityId
      });
      if (error) {
        throw error;
      }
      // Licences being added now
      const { data: selectedLicences, error: error2 } = await CRM.documents.findMany({
        document_id: { $or: documentIds },
        company_entity_id: null
      });
      if (error2) {
        throw error2;
      }

      // Check affinity between existing/selected licences
      if (existingLicences.length > 0) {
        const similar = checkNewLicenceSimilarity(selectedLicences, existingLicences);
        if (similar) {
          const { error: error3 } = await CRM.documents.updateMany({ document_id: { $or: documentIds } }, {
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
    request.yar.set('addLicenceFlow', { documentIds, selectedIds });

    return reply.redirect('/select-address');
  } catch (err) {
    if (err.name === 'NoLicencesSelectedError') {
      return reply.redirect('/select-licences?error=noLicenceSelected');
    }
    throw err;
    // errorHandler(request, reply)(err);
  }
}

/**
 * There has been an error uploading/selecting licences
 * - show user contact information
 * @param {Object} request - HAPI HTTP request instance
 * @param {Object} reply - HAPI HTTP reply instance
 */
function getLicenceSelectError (request, reply) {
  const viewContext = request.view;
  viewContext.pageTitle = 'Sorry, we need to confirm your licence information with you';
  viewContext.customTitle = 'We need to confirm your licence information';
  viewContext.activeNavLink = 'manage';
  return reply.view('water/licences-add/select-licences-error', viewContext);
}

const getUniqueAddresses = async selectedIds => {
  try {
  // Find licences in CRM for selected documents
    const { data } = await CRM.documents.findMany({ document_id: { $or: selectedIds } });

    return uniqueAddresses(data);
  } catch (err) {
    throw (err);
  }
};

/**
 * Renders an HTML form for the user to select their address for postal
 * verification
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.query - GET query params
 * @param {String} request.query.token - signed Iron token containing all and selected licence IDs
 */
async function getAddressSelect (request, reply) {
  const { view } = request;

  // Load from session
  const { selectedIds } = request.yar.get('addLicenceFlow');
  const uniqueAddressLicences = await getUniqueAddresses(selectedIds);

  return reply.view('nunjucks/form.njk', {
    ...view,
    back: '/select-licences',
    form: selectAddressForm(request, uniqueAddressLicences)
  }, { layout: false });
}

const getAddressSelectViewContext = async (request, verification, licence, fao) => {
  const { entityId } = request.defra;
  const userLicences = await getAllUserEntityLicences(entityId);

  const context = request.view;
  context.pageTitle = 'We are sending you a letter';
  context.verification = verification;
  context.fao = fao;
  context.licence = licence;
  context.licenceCount = userLicences.length;
  return context;
};

const getLicences = async selectedIds => {
  const { error, data } = await CRM.documents.findMany({
    document_id: { $or: selectedIds }
  });

  throwIfError(error);
  return data;
};

const getAllUserEntityLicences = async entityId => {
  const { error, data } = await CRM.documents.findMany({
    company_entity_id: { $ne: null },
    entity_id: entityId
  });

  throwIfError(error);
  return data;
};

const getLicence = async documentId => {
  const { error, data } = await CRM.documents.findOne(documentId);
  throwIfError(error);
  return data;
};

/**
 * Post handler for select address form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - HTTP POST request params
 * @param {String} request.payload.token - signed Iron token containing all and selected licence IDs
 * @param {String} request.payload.address - documentId for licence with address for post verify
 * @param {Object} h - HAPI Response Toolkit
 */
async function postAddressSelect (request, h) {
  const { selectedAddressId } = request.payload;
  const { selectedIds } = request.yar.get('addLicenceFlow');

  const uniqueAddresses = await getUniqueAddresses(selectedIds);
  const form = forms.handleRequest(selectAddressForm(request, uniqueAddresses), request, selectAddressSchema(uniqueAddresses));

  if (form.isValid) {
    // add selected address to addLicenceFlow in sessionStore
    const flowData = request.yar.get('addLicenceFlow');
    flowData.selectedAddressId = selectedAddressId;
    request.yar.set('addLicenceFlow', flowData);

    return h.redirect('/add-addressee');
  }

  return h.view('nunjucks/form.njk', {
    ...request.view,
    back: '/select-licences',
    form
  }, { layout: false });
}

/**
 * Renders an HTML form for the user to specify an addressee
 * @param {Object} request - HAPI HTTP request
 * @param {Object} h - HAPI HTTP reply
 */
function getFAO (request, h) {
  const { view } = request;

  return h.view('nunjucks/form.njk', {
    ...view,
    back: '/select-address',
    form: faoForm(request)
  }, { layout: false });
}

/**
 * Post handler for select address form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} request.payload - HTTP POST request params
 * @param {String} request.payload.token - signed Iron token containing all and selected licence IDs
 * @param {String} request.payload.address - documentId for licence with address for post verify
 * @param {Object} h - HAPI Response Toolkit
 */
async function postFAO (request, h) {
  const { selectedAddressId, fao } = request.payload;
  const entityId = getEntityIdFromRequest(request);

  // Load session data
  const { selectedIds } = request.yar.get('addLicenceFlow');

  const form = forms.handleRequest(faoForm(request), request, faoSchema(selectedIds));

  if (form.isValid) {
    // Find licences in CRM for selected documents
    const licenceData = await getLicences(selectedIds);

    // Get company entity ID for current user
    const companyName = licenceData[0].metadata.Name;
    const companyEntityId = await CRM.getOrCreateCompanyEntity(entityId, companyName);

    // Create verification
    const verification = await CRM.createVerification(entityId, companyEntityId, selectedIds);

    // Get the licence containing the selected verification address
    const addressLicence = await getLicence(selectedAddressId);

    // Post letter
    await Notify.sendSecurityCode(addressLicence, fao, verification.verification_code);

    // Delete data in session
    request.sessionStore.delete('addLicenceFlow');

    // add the company id to the cookie to configure company switcher correctly
    loginHelpers.selectCompany(request, { entityId: companyEntityId, name: companyName });

    const viewContext = await getAddressSelectViewContext(request, verification, addressLicence, fao);

    return h.view('nunjucks/add-licences/verification-sent.njk', viewContext, { layout: false });
  }

  return h.view('nunjucks/form.njk', {
    ...request.view,
    form
  }, { layout: false });
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
async function getSecurityCode (request, h) {
  const viewContext = request.view;
  viewContext.pageTitle = 'Enter your security code';
  viewContext.activeNavLink = 'manage';

  return h.view('water/licences-add/security-code', viewContext);
}

/**
 * Post handler for auth code form
 * @param {Object} request - HAPI HTTP request
 * @param {Object} reply - HAPI HTTP reply
 */
async function postSecurityCode (request, reply) {
  const viewContext = request.view;
  viewContext.pageTitle = 'Enter your security code';
  viewContext.activeNavLink = 'manage';

  const { entityId } = request.defra;

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
    // Verification code invalid
    if (['VerificationNotFoundError', 'ValidationError'].includes(error.name)) {
      viewContext.licences = await CRM.getOutstandingLicenceRequests(entityId);
      viewContext.error = error;
      return reply.view('water/licences-add/security-code', viewContext);
    }

    throw error;
  }
}

exports.getLicenceAdd = getLicenceAdd;
exports.postLicenceAdd = postLicenceAdd;
exports.getLicenceSelect = getLicenceSelect;
exports.postLicenceSelect = postLicenceSelect;
exports.getLicenceSelectError = getLicenceSelectError;
exports.getAddressSelect = getAddressSelect;
exports.postAddressSelect = postAddressSelect;
exports.getFAO = getFAO;
exports.postFAO = postFAO;
exports.getSecurityCode = getSecurityCode;
exports.postSecurityCode = postSecurityCode;
