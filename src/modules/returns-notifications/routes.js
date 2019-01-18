const controller = require('./controller');
const constants = require('../../lib/constants');
const returns = constants.scope.returns;

module.exports = {
  getSendForms: {
    method: 'GET',
    path: '/admin/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms to licence holders'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.getSendForms
  },
  postPreviewRecipients: {
    method: 'POST',
    path: '/admin/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms to licence holders'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.postPreviewRecipients
  },
  postSendForms: {
    method: 'POST',
    path: '/admin/returns-notifications/forms-send',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send paper return forms to licence holders'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.postSendForms
  },
  getSendFormsSuccess: {
    method: 'GET',
    path: '/admin/returns-notifications/forms-success',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Paper forms have been sent'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.getSendFormsSuccess
  },

  getFinalReminder: {
    method: 'GET',
    path: '/admin/returns-notifications/final-reminder',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Send final return reminders'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.getFinalReminder
  },

  getFinalReminderCsv: {
    method: 'GET',
    path: '/admin/returns-notifications/final-reminder/csv',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Download CSV file of recipients of final reminder letter'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.getFinalReminderCSV
  },

  postFinalReminder: {
    method: 'POST',
    path: '/admin/returns-notifications/final-reminder',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Final return reminders sent'
        },
        hapiRouteAcl: {
          permissions: ['returns:submit']
        }
      }
    },
    handler: controller.postSendFinalReminder
  }
};
