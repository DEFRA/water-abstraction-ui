'use strict';

const controller = require('../controllers/paper-forms');
const constants = require('../../../lib/constants');
const { returns } = constants.scope;

module.exports = {
  getEnterLicenceNumber: {
    method: 'GET',
    path: '/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Enter a licence number'
        }
      }
    },
    handler: controller.getEnterLicenceNumber
  },
  postEnterLicenceNumber: {
    method: 'POST',
    path: '/returns-notifications/forms',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Enter a licence number'
        }
      }
    },
    handler: controller.postEnterLicenceNumber
  },
  getCheckAnswers: {
    method: 'GET',
    path: '/returns-notifications/check-answers',
    config: {
      auth: {
        scope: returns
      },
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Check returns details'
        }
      }
    },
    handler: controller.getCheckAnswers
  }

};
