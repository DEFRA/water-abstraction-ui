'use strict';

const { cloneDeep, set } = require('lodash');
const Joi = require('@hapi/joi');
const controller = require('./controller');
const { VALID_GUID, VALID_GAUGING_STATION } = require('shared/lib/validators');

const allRoutes = {
  getLicence: {
    method: 'GET',
    path: '/licences/{documentId}',
    handler: controller.getLicence,
    config: {
      description: 'View a single licence',
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      plugins: {
        licenceData: {
          load: {
            summary: true,
            communications: true,
            primaryUser: true,
            chargeVersions: true
          }
        },
        viewContext: {
          activeNavLink: 'view'
        }
      }
    }
  },
  getLicenceContacts: {
    method: 'GET',
    path: '/licences/{documentId}/contact',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View contact info for licence',
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      plugins: {
        config: {
          view: 'nunjucks/view-licences/contact'
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
  getLicencePurposes: {
    method: 'GET',
    path: '/licences/{documentId}/purposes',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction purposes for licence',
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      plugins: {
        config: {
          view: 'nunjucks/view-licences/purposes'
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
  getLicencePoints: {
    method: 'GET',
    path: '/licences/{documentId}/points',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction points for licence',
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      plugins: {
        config: {
          view: 'nunjucks/view-licences/points'
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
  getLicenceConditions: {
    method: 'GET',
    path: '/licences/{documentId}/conditions',
    handler: controller.getLicenceDetail,
    config: {
      description: 'View abstraction conditions info for licence',
      validate: {
        params: {
          documentId: VALID_GUID
        }
      },
      plugins: {
        config: {
          view: 'nunjucks/view-licences/conditions'
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
  getLicenceGaugingStation: {
    method: 'GET',
    path: '/licences/{documentId}/station/{gaugingStation}',
    handler: controller.getLicenceGaugingStation,
    config: {
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
          view: 'nunjucks/view-licences/gauging-station'
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
  getLicenceCommunication: {
    method: 'GET',
    path: '/licences/{documentId}/communications/{communicationId}',
    handler: controller.getLicenceCommunication,
    config: {
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
};

module.exports = (allowedScopes, isSummaryPageEnabled) => {
  const routes = cloneDeep(allRoutes);

  if (!isSummaryPageEnabled) {
    delete routes.getLicence;
  }

  return Object.values(routes).map(route =>
    set(route, 'config.auth.scope', allowedScopes)
  );
};
