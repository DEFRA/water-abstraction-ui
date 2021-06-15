'use strict';

const mappers = require('./lib/mappers');

/**
 * Main Gauging station page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.gaugingStationId - gaugingStation guid
 */

const getLicencesForGaugingStation = async (request, h) => {
  const { gaugingStationId } = request.params;
  let { data } = request.pre.gaugingStations;
  let newData = mappers.mapStationsLicences(data);
  /* Format data for stations */
  if (newData.stations) {
    newData = mappers.mapStations(newData);
  }
  /* Format data for tags */
  if (newData.stations) {
    newData = mappers.mapTags(newData);
  }
  if (newData.stations.length === 0) {
    const view = {
      ...request.view,
      pageTitle: `We cannot find information for monitoring station with id ${gaugingStationId}`
    };
    return h
      .view('nunjucks/errors/404', view)
      .code(404);
  }
  return h.view('nunjucks/gauging-stations/licences', {
    ...request.view,
    tableCaption: 'All licences for gaugingstation',
    data: newData,
    gaugingStationId,
    back: `/gaugingstation/${gaugingStationId}#back`
  });
};

exports.getLicencesForGaugingStation = getLicencesForGaugingStation;
