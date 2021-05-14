'use strict';

/**
 * @module shared pre-handlers for loading licence data
 */

const { partialRight, get } = require('lodash');
const { errorHandler } = require('./lib/error-handler');
const LicenceDataService = require('../services/LicenceDataService');
const { hasScope } = require('internal/lib/permissions');
const { scope } = require('internal/lib/constants');

const buildServiceRequest = (request, options = {}) => {
  const user = {
    id: get(request, 'defra.user_id'),
    type: get(request, 'defra.user_data.usertype')
  };
  return {
    ...options,
    user
  };
};

const createPreHandler = async (request, h, methodName, errorString, allowedScopes) => {
  const service = new LicenceDataService(request.services.water.licences);

  // Check scope
  if (allowedScopes && !hasScope(request, allowedScopes)) {
    return null;
  }

  const { licenceId } = request.params;
  try {
    const data = await service[methodName](licenceId);
    return data;
  } catch (err) {
    return errorHandler(err, `${errorString} ${licenceId} ${methodName} not found`);
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
const loadChargeVersions = partialRight(createPreHandler, 'getChargeVersionsByLicenceId', 'Default licence version for licence', scope.charging);

/**
 * Get bills for given licence ID
 */
const loadBills = partialRight(createPreHandler, 'getInvoicesByLicenceId', 'Bills for licence', scope.charging);

/**
 * Get agreements for given licence ID
 */
const loadAgreements = partialRight(createPreHandler, 'getAgreementsByLicenceId', 'Agreements for licence', scope.charging);

/**
 * Get returns for given licence ID
 */
const loadReturns = partialRight(createPreHandler, 'getReturnsByLicenceId', 'Returns for licence');

/**
 * Get notifications for given licence ID
 */
const loadNotifications = partialRight(createPreHandler, 'getNotificationsByLicenceId', 'Notifications for licence');

exports.loadLicence = loadLicence;
exports.loadLicenceDocument = loadLicenceDocument;
exports.loadDefaultLicenceVersion = loadDefaultLicenceVersion;
exports.loadChargeVersions = loadChargeVersions;
exports.loadBills = loadBills;
exports.loadAgreements = loadAgreements;
exports.loadReturns = loadReturns;
exports.loadNotifications = loadNotifications;
