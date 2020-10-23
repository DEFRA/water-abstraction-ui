'use strict';

const controller = require('../controllers/batch-notifications');
const constants = require('../../../lib/constants');
const { bulkReturnNotifications } = constants.scope;

module.exports = {
  getReturnsReminderStart: {
    method: 'GET',
    path: '/returns-notifications/reminders',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send returns reminders'
        }
      }
    },
    handler: controller.getReturnsNotificationsStart
  },

  postReturnsReminderStart: {
    method: 'POST',
    path: '/returns-notifications/reminders',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send returns reminders'
        }
      }
    },
    handler: controller.postReturnsNotificationsStart
  },

  getReturnsInvitationsStart: {
    method: 'GET',
    path: '/returns-notifications/invitations',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send returns invitations'
        }
      }
    },
    handler: controller.getReturnsNotificationsStart
  },

  postReturnsInvitationsStart: {
    method: 'POST',
    path: '/returns-notifications/invitations',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send returns invitations'
        }
      }
    },
    handler: controller.postReturnsNotificationsStart
  }

};
