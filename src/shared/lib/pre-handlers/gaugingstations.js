'use strict';

const { errorHandler } = require('./lib/error-handler');
const GaugingStationsService = require('shared/lib/connectors/services/water/GaugingStationsService');
const Boom = require('@hapi/boom');
/**
 * Loads a gauging station from the water service using the Gauging Station Id
 * which can be passed in or retrieved from the request object
 * @param {Object} request
 * @param {String} companyId guid, if provided
 */
const loadGaugingStations = async request => {
  const id = request.params.gaugingStationId;
  try {
    const service = new GaugingStationsService(request.services.water);
    const res = await service.getGaugingStationLicences(id);
    if (res.data.length === 0) {
      throw Boom.notFound(`Licences not found for gaugingStationId: ${id}`);
    }
    return res;
  } catch (err) {
    return errorHandler(err, `data not found for gaugingStationId: ${id}`);
  }
};
const loadGaugingStationsByLicenceId = async request => {
  const id = request.params.licenceId;
  try {
    const service = new GaugingStationsService(request.services.water);
    const res = service.getGaugingStationsByLicenceId(id);
    if (res.length === 0) {
      throw Boom.notFound(`Gaugingstations not found for LicenceId: ${id}`);
    }
    return res;
  } catch (err) {
    return errorHandler(err, `No gaugingstation found for licenceId: ${id}`);
  }
};
exports.loadGaugingStationsByLicenceId = loadGaugingStationsByLicenceId;
exports.loadGaugingStations = loadGaugingStations;
