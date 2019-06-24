const Joi = require('joi');
const controller = require('./controller');
const { VALID_GUID, VALID_GAUGING_STATION } = require('shared/lib/validators');

module.exports = allowedScopes => [
  {
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
            communications: true,
            primaryUser: true
          }
        },
        viewContext: {
          activeNavLink: 'view'
        }
      }
    }
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  },
  {
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
  }
];
