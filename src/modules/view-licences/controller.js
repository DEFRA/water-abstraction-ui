/**
 * HAPI Route handlers for viewing and managing licences
 * @module controllers/licences
 */

const Boom = require('boom');
const { trim } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const CRM = require('../../lib/connectors/crm');
const { getLicences: baseGetLicences } = require('./base');
const { getLicencePageTitle, loadLicenceData, loadRiverLevelData, validateStationReference, riverLevelFlags, errorMapper } = require('./helpers');
const licenceConnector = require('../../lib/connectors/water-service/licences');
const { getLicenceReturns } = require('./lib/licence-returns');

const { mapReturns } = require('../returns/lib/helpers');
const { isInternal } = require('../../lib/permissions');
const communicationsConnector = require('../../lib/connectors/water-service/communications');

/**
 * Gets a list of licences with options to filter by email address,
 * Search by licence number, and sort by number/user defined name
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.emailAddress] - the email address to filter on
 * @param {String} [request.query.licenceNumber] - the licence number to search on
 * @param {String} [request.query.sort] - the field to sort on licenceNumber|name
 * @param {Number} [request.query.direction] - sort direction +1 : asc, -1 : desc
 * @param {Object} reply - the HAPI HTTP response
 */
async function getLicences (request, reply) {
  const { view } = request;

  const verifications = request.licence.outstandingVerifications;
  const licenceCount = request.licence.userLicenceCount;

  if (licenceCount === 0) {
    return verifications.length === 0
      ? reply.redirect('/add-licences')
      : reply.redirect('/security-code');
  }

  // Set view flags
  view.showVerificationAlert = verifications.length > 0;
  view.enableSearch = licenceCount > 5;

  return baseGetLicences(request, reply);
}

async function getLicenceDetail (request, reply) {
  const { documentId } = request.params;

  try {
    const { documentHeader, viewData, gaugingStations } = await loadLicenceData(request, documentId);

    const primaryUser = await licenceConnector.getLicencePrimaryUserByDocumentId(documentId);
    documentHeader.verifications = await CRM.getDocumentVerifications(documentId);

    const { system_external_id: licenceNumber, document_name: customName } = documentHeader;

    return reply.view(request.config.view, {
      ...request.view,
      canViewReturns: true,
      gaugingStations,
      licence_id: documentId,
      name: 'name' in request.view ? request.view.name : customName,
      licenceData: viewData,
      pageTitle: getLicencePageTitle(request.config.view, licenceNumber, customName),
      crmData: documentHeader,
      primaryUser
    });
  } catch (error) {
    throw errorMapper(error);
  }
};

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
async function postLicenceRename (request, reply) {
  if (request.formError) {
    return getLicenceDetail(request, reply);
  }

  const { name } = request.formValue;
  const { documentId } = request.params;

  // Rename licence
  const { error } = await CRM.documents.setLicenceName(documentId, name);
  throwIfError(error);

  return reply.redirect(`/licences/${documentId}`);
}

/**
 * Displays a gauging station flow/level data, along with HoF conditions
 * for the selected licence
 */
async function getLicenceGaugingStation (request, reply) {
  const { measure: mode } = request.query;
  const { licence_id: documentHeaderId, gauging_station: gaugingStation } = request.params;

  // Load licence data
  const licenceData = await loadLicenceData(request, documentHeaderId);

  // Validate - check that the requested station reference is in licence metadata
  if (!validateStationReference(licenceData.permitData.metadata.gaugingStations, gaugingStation)) {
    throw Boom.notFound(`Gauging station ${gaugingStation} not linked to licence ${licenceData.documentHeader.system_external_id}`);
  }

  // Load river level data
  const { hofTypes } = licenceData.viewData;
  const { riverLevel, measure } = await loadRiverLevelData(gaugingStation, hofTypes, mode);

  const { system_external_id: licenceNumber, document_name: customName } = licenceData.documentHeader;

  const viewContext = {
    ...request.view,
    ...licenceData,
    riverLevel,
    measure,
    ...riverLevelFlags(riverLevel, measure, hofTypes),
    stationReference: gaugingStation,
    pageTitle: `Gauging station for ${customName || licenceNumber}`
  };

  return reply.view('water/view-licences/gauging-station', viewContext);
};

const hasMultiplePages = pagination => pagination.pageCount > 1;

/**
 * Tabbed view details for a single licence
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.params.licence_id - CRM document header GUID
 * @param {String} [request.params.gauging_station] - gauging staion reference in flood API
 * @param {Object} reply - HAPI reply interface
 */
const getLicence = async (request, h) => {
  const { documentId } = request.params;
  const { data: licence } = await licenceConnector.getLicenceSummaryByDocumentId(documentId);
  if (!licence) {
    throw Boom.notFound(`Document ${documentId} not be found`);
  }

  const isInternalUser = isInternal(request);

  const returns = await getLicenceReturns(licence.licenceNumber, isInternalUser);
  const { data: messages } = await licenceConnector.getLicenceCommunicationsByDocumentId(documentId);

  const view = {
    ...request.view,
    documentId,
    licence,
    returns: mapReturns(returns.data, request),
    hasMoreReturns: hasMultiplePages(returns.pagination),
    messages,
    isInternal: isInternalUser,
    pageTitle: licence.documentName ? `Licence name ${licence.documentName}` : `Licence number ${licence.licenceNumber}`
  };
  return h.view('nunjucks/view-licences/licence.njk', view, { layout: false });
};

const getAddressParts = notification => {
  return [
    'addressLine1',
    'addressLine2',
    'addressLine3',
    'addressLine4',
    'addressLine5',
    'postcode'
  ].reduce((acc, part) => {
    const addressPart = trim(notification.address[part]);
    return addressPart ? [...acc, addressPart] : acc;
  }, []);
};

const getLicenceCommunication = async (request, h) => {
  const { communicationId, documentId } = request.params;
  const response = await communicationsConnector.getCommunication(communicationId);

  const licence = response.data.licenceDocuments.find(doc => doc.documentId === documentId);
  if (!licence) {
    throw Boom.notFound('Document not associated with communication');
  }

  const isInternalUser = isInternal(request);

  const viewContext = {
    ...request.view,
    ...{ pageTitle: (licence.documentName || licence.licenceRef) + ', message review' },
    licence,
    messageType: response.data.evt.name,
    sentDate: response.data.evt.createdDate,
    messageContent: response.data.notification.plainText,
    back: `${isInternalUser ? '/admin' : ''}/licences/${documentId}#communications`,
    recipientAddressParts: getAddressParts(response.data.notification),
    isInternal: isInternalUser
  };

  return h.view('nunjucks/view-licences/communication.njk', viewContext, { layout: false });
};

module.exports = {
  getLicences,
  getLicenceDetail,
  postLicenceRename,
  getLicenceGaugingStation,
  getLicence,
  getLicenceCommunication
};
