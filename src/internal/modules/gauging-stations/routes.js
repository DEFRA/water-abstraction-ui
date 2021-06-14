'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');

const { manageGaugingStationLicenceLinks } = require('internal/lib/constants').scope;
const allowedScopes = [manageGaugingStationLicenceLinks];

module.exports = {

  getThresholdAndUnit: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/threshold-and-unit',
    handler: controller.getThresholdAndUnit,
    config: {
      description: 'Gets the entry page for linking a licence to a given gauging station - Requires the user to enter a Threshold and Unit for triggering an alert',
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: []
    }
  },

  postThresholdAndUnit: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/threshold-and-unit',
    handler: controller.postThresholdAndUnit,
    config: {
      description: 'Accepts a specified threshold and unit, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getAlertType: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/alert-type',
    handler: controller.getAlertType,
    config: {
      description: 'Gets the form for selecting an alert type',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postAlertType: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/alert-type',
    handler: controller.postAlertType,
    config: {
      description: 'Accepts a specified threshold and unit, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getLicenceNumber: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/licence-number',
    handler: controller.getLicenceNumber,
    config: {
      description: 'Gets the form for entering a licence number',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postLicenceNumber: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/licence-number',
    handler: controller.postLicenceNumber,
    config: {
      description: 'Takes a licence number, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      }
    }
  }
};
