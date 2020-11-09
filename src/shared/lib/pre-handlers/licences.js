'use strict';

/**
 * @module shared pre-handlers for loading licence data
 */

const { partialRight } = require('lodash');
const { errorHandler } = require('./lib/error-handler');

const createPreHandler = async (request, h, methodName, errorString) => {
  const { licenceId } = request.params;
  try {
    const data = await request.services.water.licences[methodName](licenceId);
    return data;
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

exports.loadLicence = loadLicence;
exports.loadLicenceDocument = loadLicenceDocument;
