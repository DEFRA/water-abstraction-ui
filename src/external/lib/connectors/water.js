const apiClientFactory = require('shared/lib/connectors/api-client-factory');
const serviceRequest = require('shared/lib/connectors/service-request');

const config = require('../../config');
const waterUri = config.services.water;

const pendingImport = apiClientFactory.create(`${waterUri}/pending_import`);

const lookup = apiClientFactory.create(`${waterUri}/lookup`);

const taskConfig = apiClientFactory.create(`${waterUri}/taskConfig`);

const events = apiClientFactory.create(`${waterUri}/event`);

const gaugingStations = apiClientFactory.create(`${waterUri}/gaugingStations`);

/**
 * Get gauging station data
 * @param {String} gaugingStation - the gauging station ID
 * @return {Promise} resolves with gauging station data
 */
const getRiverLevel = function (gaugingStation) {
  const uri = `${waterUri}/river-levels/station/${gaugingStation}`;
  return serviceRequest.get(uri);
};

const picklists = apiClientFactory.create(`${waterUri}/picklists`);

const picklistItems = apiClientFactory.create(`${waterUri}/picklist-items`);

exports.pendingImport = pendingImport;
exports.lookup = lookup;
exports.taskConfig = taskConfig;
exports.events = events;
exports.getRiverLevel = getRiverLevel;
exports.gaugingStations = gaugingStations;
exports.picklists = picklists;
exports.picklistItems = picklistItems;
