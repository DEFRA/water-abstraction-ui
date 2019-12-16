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
          pageTitle: 'Account settings',
          activeNavLink: 'account-settings'
        }
      }
    }
  },

  getChangeEmail: {
    method: 'GET',
    path: '/account/change-email',
    handler: controller.getChangeEmail,
    config: {
      description: 'Redirects user to correct page depending on status'
    }
  },

  getChangeEmailLocked: {
    method: 'GET',
    path: '/account/change-email/locked',
    handler: controller.getChangeEmailLocked,
    config: {
      description: 'User cannot proceed with flow due to rate limit',
      plugins: {
        viewContext: {
          pageTitle: 'Try again later',
          activeNavLink: 'account-settings'
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
          pageTitle: 'Change your email address',
          activeNavLink: 'account-settings'
        },
        reauth: true
      }
    }
  },

  postEnterNewEmail: {
    method: 'POST',
    path: '/account/change-email/enter-new-email',
    handler: controller.postEnterNewEmail,
    config: {
      plugins: {
        viewContext: {
          pageTitle: 'Change your email address',
          activeNavLink: 'account-settings'
        },
        reauth: true
      }
    }
  },

  getVerifyEmail: {
    method: 'GET',
    path: '/account/change-email/verify-new-email',
    handler: controller.getVerifyEmail,
    config: {
      description: 'Gets page to enter the code sent to the proposed email',
      plugins: {
        viewContext: {
          pageTitle: 'Verify your email address',
          activeNavLink: 'account-settings'
        }
      }
    }
  },

  postVerifyEmail: {
    method: 'POST',
    path: '/account/change-email/verify-new-email',
    handler: controller.postVerifyEmail,
    config: {
      plugins: {
        viewContext: {
          pageTitle: 'Verify your email address',
          activeNavLink: 'account-settings'
        }
      }
    }
  },

  getSuccess: {
    method: 'GET',
    path: '/account/change-email/success',
    handler: controller.getSuccess,
    config: {
      description: 'Gets the success page for the change password flow',
      plugins: {
        viewContext: {
          pageTitle: 'Your email address is changed',
          activeNavLink: 'account-settings'
        }
      }
    }
  },

  getTryAgainLater: {
    method: 'GET',
    path: '/account/change-email/try-again-later',
    handler: controller.getTryAgainLater,
    config: {
      description: 'Gets the page after too many password attempts',
      plugins: {
        viewContext: {
          pageTitle: 'Try again later',
          activeNavLink: 'account-settings'
        }
      }
    }
  }
};
