'use strict';

const mappers = require('./lib/mappers');
const Joi = require('@hapi/joi');
/**
 * Main Gauging station page
 * All data is loaded via shared pre-handlers
 *
 * @param {String} request.params.gaugingStationId - gaugingStation guid
 */

const getLicencesForGaugingStation = async (request, h) => {
  const { gaugingStationId } = request.params;
  let { data } = request.pre.gaugingStations;

  const payloadSchema = {
    gaugingStationId: Joi.string().guid().required()
  };
  const joiOptions = {
    allowUnknown: true
  };
  const { error } = Joi.validate(request.params, payloadSchema, joiOptions);
  if (error) {
    data = [];
  }
  const newData = mappers.mapStationsLicences(data);
  let tags = {};

  /* Format data for stations, tags */
  if (newData.stations) {
    newData.stations = mappers.mapStations(newData);
  }
  if (newData.stations) {
    tags = mappers.mapTags(newData);
  }

  if ((newData.stations.length === 0) || (newData.stations[0].licences === undefined)) {
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
    pageTitle: `${newData.stations[0].riverName} at ${newData.stations[0].label}`,
    gaugingStationId: gaugingStationId,
    catchmentName: newData.stations[0].catchmentName,
    tags: tags,
    station: newData.stations[0],
    back: `/gaugingstation/${gaugingStationId}#back`
  });
};

exports.getLicencesForGaugingStation = getLicencesForGaugingStation;
