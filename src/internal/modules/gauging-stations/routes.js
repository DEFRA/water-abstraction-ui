'use strict';

const Joi = require('joi');
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
        params: Joi.object().keys({
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

  getRemoveTagsConditions: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple',
    handler: controller.getRemoveTagsConditions,
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

  postRemoveTagsLicenceSelected: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/untagging-licence/remove-tag-multiple',
    handler: controller.postRemoveTagsLicenceSelected,
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

  getNewTaggingFlow: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence',
    handler: controller.getNewTaggingFlow
  },

  getNewTaggingThresholdAndUnit: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit',
    handler: controller.getNewTaggingThresholdAndUnit,
    config: {
      description: 'Gets the entry page for linking a licence to a given gauging station - Requires the user to enter a Threshold and Unit for triggering an alert',
      auth: {
        scope: allowedScopes
      },
      validate: {
        params: Joi.object().keys({
          gaugingStationId: Joi.string().guid().required()
        })
      },
      pre: []
    }
  },

  postNewTaggingThresholdAndUnit: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/threshold-and-unit',
    handler: controller.postNewTaggingThresholdAndUnit,
    config: {
      description: 'Accepts a specified threshold and unit, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getNewTaggingAlertType: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type',
    handler: controller.getNewTaggingAlertType,
    config: {
      description: 'Gets the form for selecting an alert type',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postNewTaggingAlertType: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/alert-type',
    handler: controller.postNewTaggingAlertType,
    config: {
      description: 'Accepts a specified threshold and unit, and forwards user to the next step in the flow',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getNewTaggingLicenceNumber: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number',
    handler: controller.getNewTaggingLicenceNumber,
    config: {
      description: 'Gets the form for entering a licence number',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postNewTaggingLicenceNumber: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/licence-number',
    handler: controller.postNewTaggingLicenceNumber,
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

  getNewTaggingCondition: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/condition',
    handler: controller.getNewTaggingCondition,
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

  postNewTaggingCondition: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/condition',
    handler: controller.postNewTaggingCondition,
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

  getNewTaggingManuallyDefinedAbstractionPeriod: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period',
    handler: controller.getNewTaggingManuallyDefinedAbstractionPeriod,
    config: {
      description: 'Gets the form for inputting a manually-defined abstraction period',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postNewTaggingManuallyDefinedAbstractionPeriod: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/abstraction-period',
    handler: controller.postNewTaggingManuallyDefinedAbstractionPeriod,
    config: {
      description: 'Takes the input of a manually-defined abstraction period.',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getNewTaggingCheckYourAnswers: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/check',
    handler: controller.getNewTaggingCheckYourAnswers,
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

  postNewTaggingCheckYourAnswers: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/check',
    handler: controller.postNewTaggingCheckYourAnswers,
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

  getNewTaggingFlowComplete: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/tagging-licence/complete',
    handler: controller.getNewTaggingFlowComplete,
    config: {
      description: 'Gets the completion confirmation page',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlert: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert',
    handler: (request, h) => h.redirect(`/monitoring-stations/${request.params.gaugingStationId}/send-alert/alert-type`),
    config: {
      description: 'Redirects the user to the first step of the WAA sending flow',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertSelectAlertType: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/alert-type',
    handler: controller.getSendAlertSelectAlertType,
    config: {
      description: 'Asks the user to select an alert type for sending a new water abstraction alert',
      pre: [
        { method: preHandlers.loadGaugingStation, assign: 'station' }
      ],
      auth: {
        scope: allowedScopes
      }
    }
  },

  postSendAlertSelectAlertType: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/alert-type',
    handler: controller.postSendAlertSelectAlertType,
    config: {
      description: 'Accepts the input of the user after selecting an alert type for sending a new water abstraction alert',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertSelectAlertThresholds: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/alert-thresholds',
    handler: controller.getSendAlertSelectAlertThresholds,
    config: {
      description: 'Asks the user to select the applicable alert thresholds for sending a water abstraction alert',
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ],
      auth: {
        scope: allowedScopes
      }
    }
  },

  postSendAlertSelectAlertThresholds: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/alert-thresholds',
    handler: controller.postSendAlertSelectAlertThresholds,
    config: {
      description: 'Accepts the input of the user after selecting an alert thresholds for sending a new water abstraction alert',
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ],
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertCheckLicenceMatches: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/check-licence-matches',
    handler: controller.getSendAlertCheckLicenceMatches,
    config: {
      description: 'Asks the user to confirm the pre-selected licences for sending a water abstraction alert',
      pre: [
        { method: preHandlers.loadGaugingStationLicences, assign: 'licenceGaugingStations' }
      ],
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertExcludeLicence: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/exclude-licence/{licenceId}',
    handler: controller.getSendAlertExcludeLicence,
    config: {
      description: 'Asks the user to confirm that they wish to exclude a licence from a water abstraction alert sending process',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertExcludeLicenceConfirm: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/exclude-licence/{licenceId}/confirm',
    handler: controller.getSendAlertExcludeLicenceConfirm,
    config: {
      description: 'Excludes a licence from a water abstraction alert sending process',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertEmailAddress: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/email-address',
    handler: controller.getSendAlertEmailAddress,
    config: {
      description: 'Asks the user to set the email address that should be used for sending the alert',
      auth: {
        scope: allowedScopes
      }
    }
  },

  postSendAlertEmailAddress: {
    method: 'POST',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/email-address',
    handler: controller.postSendAlertEmailAddress,
    config: {
      description: 'Sets the email address that should be used for sending the alert',
      auth: {
        scope: allowedScopes
      }
    }
  },

  getSendAlertCheck: {
    method: 'GET',
    path: '/monitoring-stations/{gaugingStationId}/send-alert/check',
    handler: controller.getSendAlertCheck,
    config: {
      description: 'Asks the user to confirm the details of the alert are correct before triggering comms',
      auth: {
        scope: allowedScopes
      }
    }
  }
};
