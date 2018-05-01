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
        step: Joi.number().default(0)
      }
    },
    plugins: {
      viewContext: {
        pageTitle: 'Reports and notifications',
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
    ...getStep,
    method: 'POST'
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
  }
  // getRefineAudience: {
  //   method: 'GET',
  //   path: '/admin/notifications/refine/{id}',
  //   config: {
  //     description: 'Licence list view of notifications task',
  //     validate: {
  //       params: {
  //         id: Joi.number()
  //       },
  //       query: {
  //         step: Joi.number().default(0)
  //       }
  //     },
  //     plugins: {
  //       viewContext: {
  //         pageTitle: 'Reports and notifications',
  //         activeNavLink: 'notifications'
  //       }
  //     }
  //   },
  //   handler: controller.getRefineAudience
  // }
};
