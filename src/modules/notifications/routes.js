const Joi = require('joi');
const controller = require('./controller');
const contactController = require('./contact-controller');
const { VALID_EMAIL } = require('../../lib/validators');

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
  },

  getNameAndJob: {
    method: 'GET',
    path: '/admin/notifications/contact',
    handler: contactController.getNameAndJob,
    config: {
      description: 'Display contact details form if not already set in notifications flow',
      validate: {
        query: {
          redirect: Joi.string()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postNameAndJob: {
    method: 'POST',
    path: '/admin/notifications/contact',
    handler: contactController.postNameAndJob,
    config: {
      description: 'Post handler for name and job title',
      validate: {
        payload: {
          'csrf_token': Joi.string().guid().required(),
          'redirect': Joi.string().allow(''),
          'contact-name': Joi.string().allow('').max(254),
          'contact-job-title': Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        },
        formValidator: {
          payload: {
            'contact-name': Joi.string().required(),
            'contact-job-title': Joi.string().required(),
            'csrf_token': Joi.string().guid().required(),
            'redirect': Joi.string().allow('')
          }
        }
      }
    }
  },

  getDetails: {
    method: 'GET',
    path: '/admin/notifications/contact-details',
    handler: contactController.getDetails,
    config: {
      description: 'Next page of notification contact details - email, tel, address',
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postDetails: {
    method: 'POST',
    path: '/admin/notifications/contact-details',
    handler: contactController.postDetails,
    config: {
      description: 'Post handler for email/tel/address',
      validate: {
        payload: {
          'csrf_token': Joi.string().guid().required(),
          'contact-tel': Joi.string().allow('').max(254),
          'contact-email': Joi.string().allow('').max(254),
          'contact-address': Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        },
        formValidator: {
          payload: {
            'csrf_token': Joi.string().guid().required(),
            'contact-email': VALID_EMAIL,
            'contact-tel': Joi.string().required(),
            'contact-address': Joi.string().required()
          }
        }
      }
    }
  }

};

if (parseInt(process.env.test_mode) === 1) {
  routes.findEmailByAddress = {
    method: 'GET',
    path: '/notifications/last',
    handler: controller.findLastEmail,
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
