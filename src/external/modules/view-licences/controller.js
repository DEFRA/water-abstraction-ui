const Boom = require('boom');
const { trim } = require('lodash');
const { throwIfError } = require('@envage/hapi-pg-rest-api');

const services = require('../../lib/connectors/services');
const { getLicences: baseGetLicences } = require('./base');
const helpers = require('./helpers');
const { getLicenceReturns } = require('../returns/lib/helpers');

const { mapReturns } = require('../returns/lib/helpers');
const { handleRequest, getValues } = require('shared/lib/forms');
const { renameLicenceForm, renameLicenceSchema } = require('./forms/rename');

/**
 * Formats data commonly used in views, assuming that licence data has been
 * loaded by the licenceData plugin
 * @param  {Object} request - hapi request
 * @return {Object}           view data
 */
const getCommonViewContext = request => {
  const { documentId } = request.params;
  return {
    ...request.view,
    ...request.licence,
    documentId
  };
};

const getCommonBackLink = request => {
  const { documentId } = request.params;
  const { licenceNumber } = request.licence.summary;
  return {
    back: `/licences/${documentId}`,
    backText: `Licence number ${licenceNumber}`
  };
};

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
  try {
    const { licenceNumber, documentName } = request.licence.summary;

    const { pageTitle, pageHeading } = helpers.getLicencePageTitle(request.config.view, licenceNumber, documentName);

    const view = {
      ...getCommonViewContext(request),
      ...getCommonBackLink(request),
      pageTitle,
      pageHeading
    };

    return reply.view(request.config.view, view, { layout: false });
  } catch (error) {
    throw helpers.errorMapper(error);
  }
};

/**
 * Renders a page for the user to set/update licence name
 */
const getLicenceRename = (request, h, form) => {
  const { documentName } = request.licence.summary;
  const view = {
    ...getCommonViewContext(request),
    ...getCommonBackLink(request),
    form: form || renameLicenceForm(request, documentName),
    pageTitle: `Name licence ${request.licence.summary.licenceNumber}`
  };
  return h.view('nunjucks/view-licences/rename.njk', view, { layout: false });
};

/**
 * Update a licence name
 * @param {Object} request - the HAPI HTTP request
 * @param {String} request.payload.name - the new name for the licence
 * @param {Object} reply - the HAPI HTTP response
 */
async function postLicenceRename (request, h) {
  const { documentId } = request.params;
  const { documentName } = request.licence.summary;
  const form = handleRequest(renameLicenceForm(request, documentName), request, renameLicenceSchema, { abortEarly: true });

  // Validation error - redisplay form
  if (!form.isValid) {
    return getLicenceRename(request, h, form);
  }

  // Rename licence
  const { name } = getValues(form);
  const { error } = await services.crm.documents.setLicenceName(documentId, name);
  throwIfError(error);

  return h.redirect(`/licences/${documentId}`);
}

/**
 * Throws a 404 error if the gauging station requested is not attached to the
 * licence referred to in the document ID param
 * @param  {Object} request - HAPI request
 */
const validateGaugingStation = request => {
  const { gaugingStation } = request.params;
  const station = request.licence.summary.gaugingStations.find(station => (
    station.stationReference === gaugingStation
  ));
  if (!station) {
    throw Boom.notFound(`Gauging station ${gaugingStation} not found`);
  }
};

const isLevelCondition = condition =>
  (condition.code === 'CES' && condition.subCode === 'LEV');

const isFlowCondition = condition =>
  (condition.code === 'CES' && condition.subCode === 'FLOW');

const getHoFTypes = (conditions = []) => ({
  cesFlow: conditions.filter(isFlowCondition).length > 0,
  cesLev: conditions.filter(isLevelCondition).length > 0
});

/**
 * Displays a gauging station flow/level data, along with HoF conditions
 * for the selected licence
 */
const getLicenceGaugingStation = async (request, h) => {
  // Validate that gauging station is associated with this licence
  validateGaugingStation(request);

  // Get gauging station data
  const { gaugingStation } = request.params;
  const hofTypes = getHoFTypes(request.licence.summary.conditions);
  const { riverLevel, measure } = await helpers.loadRiverLevelData(gaugingStation, hofTypes);
  const { licenceNumber, documentName } = request.licence.summary;
  const { pageTitle } = helpers.getLicencePageTitle(request.config.view, licenceNumber, documentName);
  const viewContext = helpers.setConditionHofFlags(getCommonViewContext(request));

  const view = {
    ...viewContext,
    ...getCommonBackLink(request),
    pageTitle,
    riverLevel,
    measure,
    gaugingStation,
    hasGaugingStationMeasurement: riverLevel && riverLevel.active && measure
  };

  return h.view('nunjucks/view-licences/gauging-station.njk', view, { layout: false });
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
  const { licenceNumber } = request.licence.summary;

  const pagination = { page: 1, perPage: 10 };
  const returns = await getLicenceReturns([licenceNumber], pagination, false);

  const view = {
    ...getCommonViewContext(request),
    pageTitle: `Licence number ${licenceNumber}`,
    returns: mapReturns(returns.data, request),
    hasMoreReturns: hasMultiplePages(returns.pagination),
    back: '/licences'
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
  const response = await services.water.communications.getCommunication(communicationId);

  const licence = response.data.licenceDocuments.find(doc => doc.documentId === documentId);
  if (!licence) {
    throw Boom.notFound('Document not associated with communication');
  }

  const viewContext = {
    ...request.view,
    ...{ pageTitle: (licence.documentName || licence.licenceRef) + ', message review' },
    licence,
    messageType: response.data.evt.name,
    sentDate: response.data.evt.createdDate,
    messageContent: response.data.notification.plainText,
    back: `/licences/${documentId}#communications`,
    recipientAddressParts: getAddressParts(response.data.notification),
    isInternal: false
  };

  return h.view('nunjucks/view-licences/communication.njk', viewContext, { layout: false });
};

exports.getLicences = getLicences;
exports.getLicenceDetail = getLicenceDetail;
exports.postLicenceRename = postLicenceRename;
exports.getLicenceGaugingStation = getLicenceGaugingStation;
exports.validateGaugingStation = validateGaugingStation;
exports.getHoFTypes = getHoFTypes;
exports.getLicence = getLicence;
exports.getLicenceCommunication = getLicenceCommunication;
exports.getLicenceRename = getLicenceRename;
