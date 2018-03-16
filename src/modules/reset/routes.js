const controller = require('./controller');
const { VALID_EMAIL, VALID_FLASH } = require('./validators');

module.exports = {
  getResetPassword: {
    method: 'GET',
    path: '/reset_password',
    config: {
      auth: false,
      validate: {
        query: {
          flash: VALID_FLASH.REQUEST
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reset your password'
        },
        config: {
          view: 'water/reset_password'
        }
      }
    },
    handler: controller.getResetPassword
  },
  postResetPassword: {
    method: 'POST',
    path: '/reset_password',
    config: {
      auth: false,
      validate: {
        payload: {
          email_address: VALID_EMAIL.REQUEST
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reset your password'
        },
        formValidator: {
          payload: {
            email_address: VALID_EMAIL.DATA
          }
        },
        config: {
          view: 'water/reset_password',
          redirect: '/reset_password_check_email'
        }
      }
    },
    handler: controller.postResetPassword
  },
  getResetPasswordCheckEmail: {
    method: 'GET',
    path: '/reset_password_check_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Check your email'
        },
        config: {
          view: 'water/reset_password_check_email'
        }
      }
    },
    handler: controller.getResetSuccess
  },
  getResetPasswordResend: {
    method: 'GET',
    path: '/reset_password_resend_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Ask for another email'
        },
        config: {
          view: 'water/reset_password_resend_email'
        }
      }
    },
    handler: controller.getResetPassword
  },
  postResetPasswordResend: {
    method: 'POST',
    path: '/reset_password_resend_email',
    config: {
      auth: false,
      validate: {
        payload: {
          email_address: VALID_EMAIL.REQUEST
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Ask for another email'
        },
        formValidator: {
          payload: {
            email_address: VALID_EMAIL.DATA
          }
        },
        config: {
          view: 'water/reset_password_resend_email',
          redirect: '/reset_password_resent_email'
        }
      }
    },
    handler: controller.postResetPassword
  }
};
