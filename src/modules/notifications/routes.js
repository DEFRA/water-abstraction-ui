const Joi = require('joi');
const controller = require('./controller');

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
  getStep: {
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
  }
};
