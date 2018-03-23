const controller = require('./controller');
const { VALID_EMAIL, VALID_FLASH, VALID_GUID, OPTIONAL_GUID, VALID_UTM, VALID_PASSWORD, VALID_CONFIRM_PASSWORD } = require('../../lib/validators');
const Joi = require('joi');

module.exports = {
  getResetPassword: {
    method: 'GET',
    path: '/reset_password',
    config: {
      auth: false,
      validate: {
        query: {
          flash: VALID_FLASH
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reset your password'
        },
        config: {
          view: 'water/reset-password/reset_password'
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
          email_address: Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reset your password'
        },
        formValidator: {
          payload: {
            email_address: VALID_EMAIL
          }
        },
        config: {
          view: 'water/reset-password/reset_password',
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
          view: 'water/reset-password/reset_password_check_email'
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
          view: 'water/reset-password/reset_password_resend_email'
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
          email_address: Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Ask for another email'
        },
        formValidator: {
          payload: {
            email_address: VALID_EMAIL
          }
        },
        config: {
          view: 'water/reset-password/reset_password_resend_email',
          redirect: '/reset_password_resent_email'
        }
      }
    },
    handler: controller.postResetPassword
  },
  getResetPasswordResentEmail: {
    method: 'GET',
    path: '/reset_password_resent_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Check your email'
        },
        config: {
          view: 'water/reset-password/reset_password_resent_email'
        }
      }
    },
    handler: controller.getResetSuccess
  },
  getChangePassword: {
    method: 'GET',
    path: '/reset_password_change_password',
    config: {
      auth: false,
      validate: {
        query: {
          resetGuid: VALID_GUID,
          ...VALID_UTM
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        }
      }
    },
    handler: controller.getChangePassword
  },

  postChangePassword: {
    method: 'POST',
    path: '/reset_password_change_password',
    config: {
      auth: false,
      validate: {
        payload: {
          resetGuid: OPTIONAL_GUID,
          password: Joi.string().allow('').max(128),
          confirmPassword: Joi.string().allow('').max(128)
        },
        query: {
          resetGuid: OPTIONAL_GUID
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        },
        formValidator: {
          payload: {
            resetGuid: VALID_GUID,
            password: VALID_PASSWORD,
            confirmPassword: VALID_CONFIRM_PASSWORD
          },
          options: {
            abortEarly: false
          }
        }
      }
    },
    handler: controller.postChangePassword
  },

  getCreatePassword: { method: 'GET',
    path: '/create-password',
    handler: controller.getChangePassword,
    config: {
      auth: false,
      validate: {
        query: {
          resetGuid: VALID_GUID,
          ...VALID_UTM
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Create a password for your online account',
          create: true
        }
      }

    }},

  postCreatePassword: { method: 'POST',
    path: '/create-password',
    config: { auth: false,
      validate: {
        payload: {
          resetGuid: VALID_GUID,
          password: Joi.string().allow('').max(128),
          confirmPassword: Joi.string().allow('').max(128)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Create a password for your online account',
          create: true
        },
        formValidator: {
          payload: {
            resetGuid: VALID_GUID,
            password: VALID_PASSWORD,
            confirmPassword: VALID_CONFIRM_PASSWORD
          }
        }
      }
    },
    handler: controller.postChangePassword
  }

};
