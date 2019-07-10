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
        },
        companySelector: {
          ignore: true
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
        },
        companySelector: {
          ignore: true
        }
      }
    }
  },

  postConfirmPassword: {
    method: 'POST',
    path: '/account/change-email/confirm-password',
    handler: controller.postConfirmPassword,
    config: {
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
        },
        companySelector: {
          ignore: true
        }
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
          pageTitle: 'Change your email address'
        }
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
          pageTitle: 'Verify your email address'
        },
        companySelector: {
          ignore: true
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
          pageTitle: 'Verify your email address'
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
          pageTitle: 'Your email address is changed'
        },
        companySelector: {
          ignore: true
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
          pageTitle: 'Try again later'
        },
        companySelector: {
          ignore: true
        }
      }
    }
  }
};
