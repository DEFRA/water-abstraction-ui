const controller = require('./controller');
const { VALID_GUID, VALID_PASSWORD, VALID_CONFIRM_PASSWORD } = require('../../lib/validators');
const Joi = require('joi');

module.exports = {
  getCurrentPassword: {
    method: 'GET',
    path: '/update_password',
    handler: controller.getConfirmPassword,
    config: {
      description: 'Update password: enter current password',
      plugins: {
        viewContext: {
          pageTitle: 'Enter your current password'
        }
      }
    }
  },

  postCurrentPassword: {
    method: 'POST',
    path: '/update_password_verify_password',
    config: {
      description: 'Update password: verify current password',
      validate: {
        payload: {
          password: Joi.string().max(128).allow(''),
          csrf_token: VALID_GUID
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        },
        formValidator: {
          payload: {
            password: VALID_PASSWORD,
            csrf_token: VALID_GUID
          }
        }
      }
    },
    handler: controller.postConfirmPassword
  },

  postNewPassword: {
    method: 'POST',
    path: '/update_password_verified_password',
    config: {
      description: 'Update password: set new password',
      validate: {
        payload: {
          authtoken: Joi.string().max(128),
          password: Joi.string().max(128),
          confirmPassword: Joi.string().max(128),
          csrf_token: Joi.string().guid().required()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Change your password'
        },
        formValidator: {
          payload: {
            password: VALID_PASSWORD,
            confirmPassword: VALID_CONFIRM_PASSWORD,
            csrf_token: VALID_GUID,
            authtoken: VALID_GUID
          }
        }
      }
    },
    handler: controller.postSetPassword
  },

  getPasswordUpdated: {
    method: 'GET',
    path: '/password_updated',
    config: {
      description: 'Update password: success',
      plugins: {
        viewContext: {
          pageTitle: 'Your password has been changed'
        }
      }
    },
    handler: controller.getPasswordUpdated
  }

};
