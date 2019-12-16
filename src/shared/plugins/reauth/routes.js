const controller = require('./controller');

module.exports = [

  {
    method: 'GET',
    path: '/confirm-password',
    handler: controller.getConfirmPassword,
    options: {
      plugins: {
        viewContext: {
          pageTitle: 'For security, confirm your password first',
          activeNavLink: 'account-settings'
        }
      }
    }
  },

  {
    method: 'POST',
    path: '/confirm-password',
    handler: controller.postConfirmPassword,
    options: {
      plugins: {
        viewContext: {
          pageTitle: 'For security, confirm your password first',
          activeNavLink: 'account-settings'
        }
      }
    }
  },
  {
    method: 'GET',
    path: '/confirm-password/locked',
    handler: controller.getPasswordLocked,
    options: {
      plugins: {
        viewContext: {
          pageTitle: 'Try again later',
          activeNavLink: 'account-settings'
        }
      }
    }
  }
];
