'use strict';

const { pick } = require('lodash');

const mappers = require('./lib/mappers');
const { scope } = require('../../lib/constants');
const { hasScope } = require('../../lib/permissions');
const { featureToggles } = require('../../config');
const moment = require('moment');


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

  console.log('************************************');
  console.log(JSON.stringify(newData));

  return h.view('nunjucks/gauging-stations/licences', {
    ...request.view,
    tableCaption: 'All licences for gaugingstation',
    data: newData,
    gaugingStationId,
    back: `/gaugingstation/${gaugingStationId}#back`
  });
};

exports.getLicencesForGaugingStation = getLicencesForGaugingStation;
