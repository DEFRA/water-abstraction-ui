const Joi = require('joi');
const controller = require('./controller');
const contactRoutes = require('./contact-routes');
const apiController = require('./api-controller');
const constants = require('../../lib/constants');
const allAdmin = constants.scope.allAdmin;

const getStep = {
  method: 'GET',
  path: '/admin/notifications/{id}',
  config: {
    auth: {
      scope: allAdmin
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
        // pageTitle: 'Reports and notifications',
        activeNavLink: 'notifications'
      }
    }
  },
  handler: controller.getStep
};

const routes = {
  getResetPassword: {
    method: 'GET',
    path: '/admin/notifications',
    config: {
      auth: {
        scope: allAdmin
      },
      description: 'Admin report/notifications index page',
      plugins: {
        viewContext: {
          pageTitle: 'Reports and notifications',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getIndex
  },
  getStep,
  postStep: {
    path: '/admin/notifications/{id}',
    method: 'POST',
    handler: controller.postStep,
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/refine',
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/refine',
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/data',
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/data',
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/preview',
    config: {
      auth: {
        scope: allAdmin
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
    path: '/admin/notifications/{id}/send',
    config: {
      auth: {
        scope: allAdmin
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

if (parseInt(process.env.test_mode) === 1) {
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
