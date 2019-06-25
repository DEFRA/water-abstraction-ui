const controller = require('./controller');
const { VALID_GUID, VALID_PASSWORD, VALID_CONFIRM_PASSWORD } = require('shared/lib/validators');
const Joi = require('joi');

module.exports = [{
  method: 'GET',
  path: '/update_password',
  handler: controller.getConfirmPassword,
  config: {
    description: 'Update password: enter current password',
    plugins: {
      viewContext: {
        pageTitle: 'Enter your current password',
        activeNavLink: 'change-password'
      },
      licenceLoader: {
        loadUserLicenceCount: true
      }
    }
  }
},

{
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
        pageTitle: 'Change your password',
        activeNavLink: 'change-password'
      },
      formValidator: {
        payload: {
          password: VALID_PASSWORD,
          csrf_token: VALID_GUID
        }
      },
      licenceLoader: {
        loadUserLicenceCount: true
      }
    }
  },
  handler: controller.postConfirmPassword
},

{
  method: 'POST',
  path: '/update_password_verified_password',
  config: {
    description: 'Update password: set new password',
    validate: {
      payload: {
        authtoken: Joi.string().max(128),
        password: Joi.string().max(128).allow(''),
        confirmPassword: Joi.string().max(128).allow(''),
        csrf_token: Joi.string().guid().required()
      }
    },
    plugins: {
      viewContext: {
        pageTitle: 'Change your password',
        activeNavLink: 'change-password'
      },
      formValidator: {
        payload: {
          password: VALID_PASSWORD,
          confirmPassword: VALID_CONFIRM_PASSWORD,
          csrf_token: VALID_GUID,
          authtoken: VALID_GUID
        },
        options: {
          abortEarly: false
        }
      },
      licenceLoader: {
        loadUserLicenceCount: true
      }
    }
  },
  handler: controller.postSetPassword
},

{
  method: 'GET',
  path: '/password_updated',
  config: {
    description: 'Update password: success',
    plugins: {
      viewContext: {
        pageTitle: 'Your password has been changed',
        activeNavLink: 'change-password'
      }
    }
  },
  handler: controller.getPasswordUpdated
}
];
