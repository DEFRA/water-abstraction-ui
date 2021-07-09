'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');
const preHandlers = require('./lib/prehandlers');
const helpers = require('./lib/helpers');
const { manageGaugingStationLicenceLinks } = require('internal/lib/constants').scope;
const allowedScopes = [manageGaugingStationLicenceLinks];

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
        { method: preHandlers.loadGaugingStation, assign: 'station' },
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  getRemoveTags: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag',
    handler: controller.getRemoveTags,
    config: {
      description: 'Gets the entry page for remove linking a licence to a given gauging station - Requires the user to select tag',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  getRemoveMultipleTagsCheckbox: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple',
    handler: controller.getRemoveMultipleTagsCheckbox,
    config: {
      description: 'Gets the entry page for remove linking a licence to a given gauging station - Requires the user to select tag',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  postRemoveTagsMultiple: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple',
    handler: controller.postRemoveTagsMultiple,
    config: {
      description: 'Accepts a specified tag',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  postRemoveTag: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag',
    handler: controller.postRemoveTagOrMultiple,
    config: {
      description: 'Accepts a specified tag',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  getRemoveTagComplete: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-complete',
    handler: controller.getRemoveTagComplete,
    config: {
      description: 'remove linking a licence to a given gauging station - Comfirm removal',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ]
    }
  },

  postRemoveTagComplete: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-complete',
    handler: controller.postRemoveTagComplete
  },

  getNewFlow: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence',
    handler: controller.getNewFlow
  },

  getThresholdAndUnit: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit',
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
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit',
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
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type',
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
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type',
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
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number',
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
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number',
    handler: controller.postLicenceNumber,
    config: {
      description: 'Takes a licence number, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: helpers.isLicenceNumberValid, assign: 'isLicenceNumberValid' }
      ]
    }
  },

  getCondition: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/condition',
    handler: controller.getCondition,
    config: {
      description: 'Gets the form for selecting a relevant licence condition',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]
    }
  },

  postCondition: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/condition',
    handler: controller.postCondition,
    config: {
      description: 'Takes input of the condition GUID. Accepts Null to indicate a linkage which is not condition-specific.',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]
    }
  },

  getManuallyDefinedAbstractionPeriod: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period',
    handler: controller.getManuallyDefinedAbstractionPeriod,
    config: {
      description: 'Gets the form for inputting a manually-defined abstraction period',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postManuallyDefinedAbstractionPeriod: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period',
    handler: controller.postManuallyDefinedAbstractionPeriod,
    config: {
      description: 'Takes the input of a manually-defined abstraction period.',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getCheckYourAnswers: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/check',
    handler: controller.getCheckYourAnswers,
    config: {
      description: 'Gets the check your answers page',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]
    }
  },

  postCheckYourAnswers: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/check',
    handler: controller.postCheckYourAnswers,
    config: {
      description: 'Posts the payload.',
      auth: {
        scope: allowedScopes
      },
      pre: [
        { method: helpers.fetchConditionsForLicence, assign: 'conditionsForSelectedLicence' }
      ]
    }
  },

  getFlowComplete: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/complete',
    handler: controller.getFlowComplete,
    config: {
      description: 'Gets the completion confirmation page',
      auth: {
        scope: allowedScopes
      }
    }
  }
};
