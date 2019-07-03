const controller = require('./controller');

module.exports = {
  getAccount: {
    method: 'GET',
    path: '/account',
    handler: controller.getAccount,
    config: {
      description: 'Get the account settings entry page',
      plugins: {
        viewContext: {
          pageTitle: 'Account settings'
        }
      }
    }
  },

  getConfirmPassword: {
    method: 'GET',
    path: '/account/change-email/confirm-password',
    handler: controller.getConfirmPassword,
    config: {
      description: 'Gets page to confirm the users password',
      plugins: {
        viewContext: {
          pageTitle: 'For security, confirm your password first'
        }
      }
    }
  },

  postConfirmPassword: {
    method: 'POST',
    path: '/account/change-email/confirm-password',
    handler: controller.postConfirmPassword,
    config: {
      description: 'Endpoint to post password data to for changing email',
      plugins: {
        viewContext: {
          pageTitle: 'For security, confirm your password first'
        }
      }
    }
  },

  getEnterNewEmail: {
    method: 'GET',
    path: '/account/change-email/enter-new-email',
    handler: controller.getEnterNewEmail,
    config: {
      description: 'Gets page to confirm the users new email',
      plugins: {
        viewContext: {
          pageTitle: 'Change your email address'
        }
      }
    }
  }
};
