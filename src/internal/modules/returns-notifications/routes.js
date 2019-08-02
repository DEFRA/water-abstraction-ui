const controller = require('./controller');
const constants = require('../../lib/constants');
const { returns, bulkReturnNotifications } = constants.scope;

module.exports = {
  getSendForms: {
    method: 'GET',
    path: '/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms'
        }
      }
    },
    handler: controller.getSendForms
  },
  postPreviewRecipients: {
    method: 'POST',
    path: '/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms'
        }
      }
    },
    handler: controller.postPreviewRecipients
  },
  postSendForms: {
    method: 'POST',
    path: '/returns-notifications/forms-send',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms'
        }
      }
    },
    handler: controller.postSendForms
  },
  getSendFormsSuccess: {
    method: 'GET',
    path: '/returns-notifications/forms-success',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Paper forms have been sent'
        }
      }
    },
    handler: controller.getSendFormsSuccess
  },

  getFinalReminder: {
    method: 'GET',
    path: '/returns-notifications/final-reminder',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send final return reminders'
        }
      }
    },
    handler: controller.getFinalReminder
  },

  getFinalReminderCsv: {
    method: 'GET',
    path: '/returns-notifications/final-reminder/csv',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Download CSV file of recipients of final reminder letter'
        }
      }
    },
    handler: controller.getFinalReminderCSV
  },

  postFinalReminder: {
    method: 'POST',
    path: '/returns-notifications/final-reminder',
    config: {
      auth: {
        scope: bulkReturnNotifications
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Final return reminders sent'
        }
      }
    },
    handler: controller.postSendFinalReminder
  },

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
