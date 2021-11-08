'use strict';

/**
 * @module shared pre-handlers for loading licence data
 */

const { partialRight, identity } = require('lodash');
const { errorHandler } = require('./lib/error-handler');
const LicenceDataService = require('../services/LicenceDataService');
const { hasScope } = require('internal/lib/permissions');
const { scope } = require('internal/lib/constants');

const createPreHandler = async (request, h, methodName, errorString, allowedScopes) => {
  const service = new LicenceDataService(request.services.water);

  // Check scope
  if (allowedScopes && !hasScope(request, allowedScopes)) {
    return null;
  }

  const { licenceId } = request.params;
  try {
    return await service[methodName](licenceId);
  } catch (err) {
    return errorHandler(err, `${errorString} ${licenceId} not found`);
  }
};

/**
 * Loads a licence from the water service using the {licenceId}
 * route param
 * @todo refactor to use this implementation throughout application
 * @param {String} request.params.licenceId
 */
const loadLicence = partialRight(createPreHandler, 'getLicenceById', 'Licence');

/**
 * Loads a CRM v1 document from the water service using the {licenceId}
 * route param
 * @todo refactor to use this implementation throughout application
 * @param {String} request.params.licenceId
 */
const loadLicenceDocument = partialRight(createPreHandler, 'getDocumentByLicenceId', 'CRM document for licence');

/**
 * Load default licence version for given licence ID
 */
const loadDefaultLicenceVersion = partialRight(createPreHandler, 'getDefaultLicenceVersionByLicenceId', 'Default licence version for licence');

/**
 * Get charge versions for given licence ID
 */
const loadChargeVersions = partialRight(createPreHandler, 'getChargeVersionsByLicenceId', 'Charge versions for licence', scope.viewChargeVersions);

/**
 * Get charge version workflows for given licence ID
 */
const loadChargeVersionWorkflows = partialRight(
  createPreHandler,
  'getChargeVersionWorkflowsByLicenceId',
  'Charge version workflows for licence',
  [scope.chargeVersionWorkflowEditor, scope.chargeVersionWorkflowReviewer, scope.viewChargeVersions]
);

/**
 * Get bills for given licence ID
 */
const loadBills = async request => {
  if (!hasScope(request, scope.billing)) {
    return null;
  }

  // Allow pagination to be controlled via query params
  const { licenceId } = request.params;
  const { page = 1, perPage = 10 } = request.query;

  // Create licence data service and fetch data
  const service = new LicenceDataService(request.services.water);
  return service.getInvoicesByLicenceId(licenceId, page, perPage);
};

/**
 * Get agreements for given licence ID
 */
const loadAgreements = partialRight(createPreHandler, 'getAgreementsByLicenceId', 'Agreements for licence');

/**
 * Get returns for given licence ID
 */
const loadReturns = partialRight(createPreHandler, 'getReturnsByLicenceId', 'Returns for licence');

/**
 * Get notifications for given licence ID
 */
const loadNotifications = partialRight(createPreHandler, 'getNotificationsByLicenceId', 'Notifications for licence');

/**
 * Get licence summary data
 * Note: this depends on the document ID and needs updating to use the licence ID
 * and moving to the LicenceDataService
 */
const loadSummary = async request => {
  const { licence, document: { document_id: documentId }, licenceVersion } = request.pre;
  // Skip if licence is not active, as only the "current" version of a licence
  // is currently supported
  if (!licence.isActive) {
    return null;
  }

  // Skip if there is no licence version to display
  if (!licenceVersion.id) {
    return null;
  }

  const { data } = await request.services.water.licences.getSummaryByDocumentId(documentId, { includeExpired: true });
  return data;
};

/**
 * Get licence primary user
 * Note: this depends on the document ID and needs updating to use the licence ID
 * and moving to the LicenceDataService
 *
 * @return {Promise<Object|Null}
 */
const loadPrimaryUser = async request => {
  const { document: { document_id: documentId } } = request.pre;
  const { data } = await request.services.water.licences.getPrimaryUserByDocumentId(documentId);
  return data || null;
};

const getNewTaggingLicenceNumberFromReturnId = returnId =>
  returnId.split(/:/g)[2];

/**
 * Pre handler to load Return service model
 */
const getLicenceByReturnId = async request => {
  // Get return ID from either params/query
  const returnId = [
    request.params.returnId,
    request.query.returnId,
    request.query.id
  ].find(identity);

  const licenceNumber = getNewTaggingLicenceNumberFromReturnId(returnId);

  try {
    return await request.services.water.licences.getLicenceByLicenceNumber(licenceNumber);
  } catch (err) {
    return errorHandler(err, `Licence ${licenceNumber} for return ${returnId} not found`);
  }
};

exports.loadLicence = loadLicence;
exports.loadLicenceDocument = loadLicenceDocument;
exports.loadDefaultLicenceVersion = loadDefaultLicenceVersion;
exports.loadChargeVersions = loadChargeVersions;
exports.loadChargeVersionWorkflows = loadChargeVersionWorkflows;
exports.loadBills = loadBills;
exports.loadAgreements = loadAgreements;
exports.loadReturns = loadReturns;
exports.loadNotifications = loadNotifications;
exports.loadSummary = loadSummary;
exports.loadPrimaryUser = loadPrimaryUser;
exports.getLicenceByReturnId = getLicenceByReturnId;
