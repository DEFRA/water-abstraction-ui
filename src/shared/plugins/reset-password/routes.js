const controller = require('./controller');
const { VALID_EMAIL, VALID_FLASH, VALID_GUID, OPTIONAL_GUID, VALID_UTM, VALID_PASSWORD, VALID_CONFIRM_PASSWORD } = require('../../lib/validators');
const Joi = require('joi');

module.exports = [
  {
    method: 'GET',
    path: '/reset_password',
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          flash: VALID_FLASH
        })
      },
      plugins: {
        viewContext: {
          back: '/signin',
          pageTitle: 'Reset your password'
        },
        config: {
          view: 'nunjucks/reset-password/reset-password'
        }
      }
    },
    handler: controller.getResetPassword
  },
  {
    method: 'POST',
    path: '/reset_password',
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          email: Joi.string().allow('').max(254)
        })
      },
      plugins: {
        viewContext: {
          back: '/signin',
          pageTitle: 'Reset your password'
        },
        formValidator: {
          payload: Joi.object().keys({
            email_address: VALID_EMAIL
          })
        },
        config: {
          view: 'nunjucks/reset-password/reset-password',
          redirect: '/reset_password_check_email'
        }
      }
    },
    handler: controller.postResetPassword
  },
  {
    method: 'GET',
    path: '/reset_password_check_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Check your email',
          back: '/signin'
        },
        config: {
          view: 'nunjucks/reset-password/reset-password-sent'
        }
      }
    },
    handler: controller.getResetSuccess
  },
  {
    method: 'GET',
    path: '/reset_password_resend_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Ask for another email',
          back: '/reset_password_check_email'
        },
        config: {
          view: 'nunjucks/reset-password/reset-password-resend'
        }
      }
    },
    handler: controller.getResetPassword
  },
  {
    method: 'POST',
    path: '/reset_password_resend_email',
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          email: Joi.string().allow('').max(254)
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Ask for another email',
          back: '/reset_password_check_email'
        },
        formValidator: {
          payload: Joi.object().keys({
            email_address: VALID_EMAIL
          })
        },
        config: {
          view: 'nunjucks/reset-password/reset-password-resend',
          redirect: '/reset_password_resent_email'
        }
      }
    },
    handler: controller.postResetPassword
  },
  {
    method: 'GET',
    path: '/reset_password_resent_email',
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Check your email'
        },
        config: {
          view: 'nunjucks/reset-password/reset-password-resent'
        }
      }
    },
    handler: controller.getResetSuccess
  },
  {
    method: 'GET',
    path: '/reset_password_change_password',
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          resetGuid: VALID_GUID,
          ...VALID_UTM
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        }
      }
    },
    handler: controller.getChangePassword
  },

  {
    method: 'POST',
    path: '/reset_password_change_password',
    config: {
      auth: false,
      validate: {
        payload: Joi.object().keys({
          resetGuid: OPTIONAL_GUID,
          password: Joi.string().allow('').max(128),
          confirmPassword: Joi.string().allow('').max(128)
        }),
        query: Joi.object().keys({
          resetGuid: OPTIONAL_GUID
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        },
        formValidator: {
          payload: Joi.object().keys({
            resetGuid: VALID_GUID,
            password: VALID_PASSWORD,
            confirmPassword: VALID_CONFIRM_PASSWORD
          }),
          options: {
            abortEarly: false
          }
        }
      }
    },
    handler: controller.postChangePassword
  },

  {
    method: 'GET',
    path: '/create-password',
    handler: controller.getChangePassword,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          resetGuid: VALID_GUID,
          ...VALID_UTM
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Create a password',
          create: true
        }
      }
    }
  },

  {
    method: 'POST',
    path: '/create-password',
    config: { auth: false,
      validate: {
        payload: Joi.object().keys({
          resetGuid: VALID_GUID,
          password: Joi.string().allow('').max(128),
          confirmPassword: Joi.string().allow('').max(128)
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Create a password',
          create: true
        },
        formValidator: {
          payload: Joi.object().keys({
            resetGuid: VALID_GUID,
            password: VALID_PASSWORD,
            confirmPassword: VALID_CONFIRM_PASSWORD
          }),
          options: {
            abortEarly: false
          }
        }
      }
    },
    handler: controller.postChangePassword
  }
];
