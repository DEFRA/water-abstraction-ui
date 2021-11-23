const controller = require('./controller');
const { VALID_FLASH, VALID_GUID, VALID_UTM } = require('../../lib/validators');
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
          pageTitle: 'Reset your password'
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
      plugins: {
        viewContext: {
          back: '/signin',
          pageTitle: 'Reset your password'
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
      validate: {
        query: Joi.object().keys({
          flash: VALID_FLASH
        })
      },
      plugins: {
        viewContext: {
          pageTitle: 'Reset your password'
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
          pageTitle: 'Reset your password'
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
          forced: Joi.number().optional(),
          ...VALID_UTM
        }).allow(null)
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
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
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
    config: {
      auth: false,
      plugins: {
        viewContext: {
          pageTitle: 'Create a password',
          create: true
        }
      }
    },
    handler: controller.postChangePassword
  }
];
