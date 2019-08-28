const Boom = require('@hapi/boom');
const { trim, sortBy } = require('lodash');
const { selectRiverLevelMeasure } = require('./lib/river-level');
const { getLicencePageTitle, getCommonViewContext } = require('./lib/view-helpers');
const { getCommonBackLink } = require('shared/lib/view-licence-helpers');
const { getHoFTypes } = require('./lib/conditions');
const { errorMapper } = require('./lib/error');

async function getLicenceDetail (request, reply) {
  try {
    const { licenceNumber, documentName } = request.licence.summary;

    const { pageTitle, pageHeading } = getLicencePageTitle(request.config.view, licenceNumber, documentName);

    const view = {
      ...getCommonViewContext(request),
      ...getCommonBackLink(request),
      pageTitle,
      pageHeading
    };

    return reply.view(request.config.view, view, { layout: false });
  } catch (error) {
    throw errorMapper(error);
  }
};

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

const getRiverLevel = async (request, h) => {
  const { gaugingStation } = request.params;
  const { getRiverLevel } = h.realm.pluginOptions;
  try {
    const data = await getRiverLevel(gaugingStation);
    return data;
  } catch (err) {
    if (err.statusCode !== 404) {
      throw err;
    }
  }
};

/**
 * Displays a gauging station flow/level data, along with HoF conditions
 * for the selected licence
 */
const getLicenceGaugingStation = async (request, h) => {
  // Validate that gauging station is associated with this licence
  validateGaugingStation(request);

  const hofTypes = getHoFTypes(request.licence.summary.conditions);
  const riverLevel = await getRiverLevel(request, h);
  const measure = selectRiverLevelMeasure(riverLevel, hofTypes);

  // Get gauging station data
  const { gaugingStation } = request.params;

  // const { riverLevel, measure } = await helpers.loadRiverLevelData(gaugingStation, hofTypes);
  const { licenceNumber, documentName } = request.licence.summary;
  const { pageTitle } = getLicencePageTitle(request.config.view, licenceNumber, documentName);

  const view = {
    ...getCommonViewContext(request),
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

  const { getLicenceSummaryReturns, getReturnPath, canShowCharging } = h.realm.pluginOptions;

  const returns = await getLicenceSummaryReturns(licenceNumber);

  const view = {
    ...getCommonViewContext(request),
    pageTitle: `Licence number ${licenceNumber}`,
    returns: returns.data.map(ret => ({ ...ret, ...getReturnPath(ret, request) })),
    hasMoreReturns: hasMultiplePages(returns.pagination),
    back: '/licences',
    showChargeVersions: canShowCharging(request),
    chargeVersions: sortBy(request.licence.chargeVersions, 'versionNumber').reverse()
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
  const { getCommunication } = h.realm.pluginOptions;

  const { communicationId, documentId } = request.params;
  const response = await getCommunication(communicationId);

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

exports.getLicenceDetail = getLicenceDetail;
exports.getLicenceGaugingStation = getLicenceGaugingStation;
exports.validateGaugingStation = validateGaugingStation;
exports.getHoFTypes = getHoFTypes;
exports.getLicence = getLicence;
exports.getLicenceCommunication = getLicenceCommunication;
