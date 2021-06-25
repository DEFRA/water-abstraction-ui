'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');
const preHandlers = require('shared/lib/pre-handlers/gaugingstations');

module.exports = {

  getMonitoringStation: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}',
    handler: controller.getMonitoringStation,
    config: {
      description: 'Gets summary details about a particular gauging station',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: [
        { method: preHandlers.loadGaugingStations, assign: 'gaugingStations' }
      ]
    }
  }

};
