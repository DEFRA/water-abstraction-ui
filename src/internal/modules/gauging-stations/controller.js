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
  const { data } = request.pre.gaugingStations;
  let newData = mappers.mapStationsLicences(data);
  /* Format data for stations */
  if (newData.stations) {
    newData = mappers.mapStations(newData);
  }
  /* Format data for tags */
  if (newData.stations) {
    newData = mappers.mapTags(newData);
  }
  if ((newData.stations.length === 0) || (newData.stations[0].licenceRef === undefined)) {
    const view = {
      ...request.view,
      pageTitle: `We cannot find information for monitoring station with id ${gaugingStationId}`
    };
    return h
      .view('nunjucks/errors/404', view);
  }
  return h.view('nunjucks/gauging-stations/licences', {
    ...request.view,
    tableCaption: 'All licences for gaugingstation',
    stations: newData,
    gaugingStationId,
    back: `/gaugingstation/${gaugingStationId}#back`
  });
};

exports.getLicencesForGaugingStation = getLicencesForGaugingStation;
