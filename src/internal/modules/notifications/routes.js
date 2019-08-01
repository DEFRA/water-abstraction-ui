const Joi = require('@hapi/joi');
const controller = require('./controller');
const contactRoutes = require('./contact-routes');
const apiController = require('./api-controller');
const { scope } = require('../../lib/constants');

const allowedScopes = [scope.hofNotifications, scope.renewalNotifications];

const getStep = {
  method: 'GET',
  path: '/notifications/{id}',
  config: {
    auth: {
      scope: allowedScopes
    },
    description: 'Admin view step of notification task',
    validate: {
      params: {
        id: Joi.number()
      },
      query: {
        step: Joi.number().default(0),
        data: Joi.string(),
        start: Joi.number().default(0).allow(0, 1)
      }
    },
    plugins: {
      viewContext: {
        activeNavLink: 'notifications'
      }
    }
  },
  handler: controller.getStep
};

const routes = {
  getManage: {
    method: 'GET',
    path: '/notifications',
    config: {
      auth: {
        scope: scope.hasManageTab
      },
      description: 'Manage tab',
      plugins: {
        viewContext: {
          pageTitle: 'Manage reports and notices',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getManageTab
  },
  getStep,
  postStep: {
    path: '/notifications/{id}',
    method: 'POST',
    handler: controller.postStep,
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Post handler for single step of notification query flow',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications'
        }
      }
    }
  },
  getRefine: {
    method: 'GET',
    path: '/notifications/{id}/refine',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: refine audience',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getRefine
  },
  postRefine: {
    method: 'POST',
    path: '/notifications/{id}/refine',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: refine audience',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.postRefine
  },
  getVariableData: {
    method: 'GET',
    path: '/notifications/{id}/data',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: add custom data',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getVariableData
  },
  postVariableData: {
    method: 'POST',
    path: '/notifications/{id}/data',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: add custom data',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.postVariableData
  },

  getPreview: {
    method: 'GET',
    path: '/notifications/{id}/preview',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: preview',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getPreview
  },

  postSend: {
    method: 'POST',
    path: '/notifications/{id}/send',
    config: {
      auth: {
        scope: allowedScopes
      },
      description: 'Notification: send messages',
      validate: {
        params: {
          id: Joi.number()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.postSend
  },

  ...contactRoutes

};

if (parseInt(process.env.TEST_MODE) === 1) {
  routes.findEmailByAddress = {
    method: 'GET',
    path: '/notifications/last',
    handler: apiController.findLastEmail,
    config: {
      plugins: {
        errorPlugin: {
          ignore: true
        }
      },
      auth: false,
      validate: {
        query: Joi.object().keys({
          email: Joi.string().required()
        })
      }
    }
  };
}

module.exports = routes;
