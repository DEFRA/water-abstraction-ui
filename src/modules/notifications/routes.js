const Joi = require('joi');
const controller = require('./controller');

const getStep = {
  method: 'GET',
  path: '/admin/notifications/{id}',
  config: {
    description: 'Admin view step of notification task',
    validate: {
      params: {
        id: Joi.number()
      },
      query: {
        step: Joi.number().default(0),
        data: Joi.string()
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

module.exports = {
  getResetPassword: {
    method: 'GET',
    path: '/admin/notifications',
    config: {
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
  }

};
