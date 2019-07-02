const Joi = require('joi');
const controller = require('./controller');
const { VALID_GUID, VALID_LICENCE_QUERY, VALID_GAUGING_STATION } = require('shared/lib/validators');

const { scope } = require('../../lib/constants');

const allowedScopes = [scope.licenceHolder, scope.colleague, scope.colleagueWithReturns];

const getLicence = {
  method: 'GET',
  path: '/licences/{documentId}',
  handler: controller.getLicence,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View a single licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/licence'
      },
      licenceData: {
        load: {
          summary: true,
          communications: true
        }
      },
      viewContext: {
        activeNavLink: 'view'
      }
    }
  }
};

const getLicenceRename = {
  method: 'GET',
  path: '/licences/{documentId}/rename',
  handler: controller.getLicenceRename,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Set user-defined name for licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/rename'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const postLicenceRename = {
  method: 'POST',
  path: '/licences/{documentId}/rename',
  handler: controller.postLicenceRename,
  config: {
    description: 'Update the user-defined licence name',
    auth: {
      scope: allowedScopes
    },
    validate: {
      params: {
        documentId: VALID_GUID
      },
      payload: {
        name: Joi.string().allow('').max(32),
        csrf_token: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'water/view-licences/rename'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicenceContact = {
  method: 'GET',
  path: '/licences/{documentId}/contact',
  handler: controller.getLicenceDetail,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View contact info for licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'nunjucks/view-licences/contact.njk'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicencePurposes = {
  method: 'GET',
  path: '/licences/{documentId}/purposes',
  handler: controller.getLicenceDetail,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View abstraction purposes for licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'nunjucks/view-licences/purposes.njk'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicencePoints = {
  method: 'GET',
  path: '/licences/{documentId}/points',
  handler: controller.getLicenceDetail,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View abstraction points for licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'nunjucks/view-licences/points.njk'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicenceConditions = {
  method: 'GET',
  path: '/licences/{documentId}/conditions',
  handler: controller.getLicenceDetail,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View abstraction conditions info for licence',
    validate: {
      params: {
        documentId: VALID_GUID
      }
    },
    plugins: {
      config: {
        view: 'nunjucks/view-licences/conditions.njk'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicenceGaugingStation = {
  method: 'GET',
  path: '/licences/{documentId}/station/{gaugingStation}',
  handler: controller.getLicenceGaugingStation,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'View abstraction conditions info for licence',
    validate: {
      params: {
        documentId: VALID_GUID,
        gaugingStation: VALID_GAUGING_STATION
      },
      query: {
        measure: Joi.string().allow('level', 'flow', 'auto').default('auto')
      }
    },
    plugins: {
      config: {
        view: 'nunjucks/view-licences/gauging-station.njk'
      },
      viewContext: {
        activeNavLink: 'view'
      },
      licenceData: {
        load: {
          summary: true
        }
      }
    }
  }
};

const getLicenceCommunication = {
  method: 'GET',
  path: '/licences/{documentId}/communications/{communicationId}',
  handler: controller.getLicenceCommunication,
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Look at the content of a message sent to the user regarding the licence',
    validate: {
      params: {
        communicationId: VALID_GUID,
        documentId: VALID_GUID
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'view'
      }
    }
  }
};

module.exports = {
  getLicences: {
    method: 'GET',
    path: '/licences',
    handler: controller.getLicences,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'View list of licences with facility to sort/filter',
      validate: {
        query: VALID_LICENCE_QUERY
      },
      plugins: {
        viewContext: {
          pageTitle: 'Your licences',
          customTitle: 'Your water abstraction or impoundment licences',
          showResults: true,
          activeNavLink: 'view'
        },
        licenceLoader: {
          loadOutstandingVerifications: true,
          loadUserLicenceCount: true
        },
        formValidator: {
          query: {
            emailAddress: Joi.string().allow('').email(),
            licenceNumber: Joi.string().allow(''),
            sort: Joi.string().valid('licenceNumber', 'name', 'expiryDate').default('licenceNumber'),
            direction: Joi.number().valid(1, -1).default(1),
            page: Joi.number().allow('').min(1).default(1)
          }
        }
      }
    }
  },
  getLicence,
  getLicenceRename,
  postLicenceRename,
  getLicenceContact,
  getLicenceConditions,
  getLicencePoints,
  getLicencePurposes,
  getLicenceGaugingStation,
  getLicenceCommunication
};
