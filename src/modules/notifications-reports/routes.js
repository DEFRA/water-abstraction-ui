const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/admin/notifications/report',
    handler: controller.getNotificationsList,
    config: {
      description: 'View list of notifications sent',
      validate: {
        query: {
          sort: Joi.string().valid('created', 'notification', 'issuer', 'recipients', 'status').default('created'),
          direction: Joi.number().valid(-1, +1).default(-1)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Notification report'
        }
      }
    }
  }

};
