const controller = require('./controller');
const { VALID_GUID, VALID_PASSWORD, VALID_CONFIRM_PASSWORD } = require('shared/lib/validators');
const Joi = require('@hapi/joi');

/**
 * Creates an anonymous route that simply redirects from one URL permanently
 * to another.
 *
 * @param {string} from The existing url to map elsewhere
 * @param {string} to The new target url that will be redirected to
 */
const permanentRedirectFactory = (from, to) => ({
  method: 'GET',
  path: from,
  handler: (req, h) => h.response().code(301).redirect(to),
  config: {
    auth: false
  }
});

module.exports = [
  permanentRedirectFactory('/update_password', '/account/update-password'),

  {
    method: 'GET',
    path: '/account/update-password',
    handler: controller.getConfirmPassword,
    config: {
      description: 'Update password: enter new password',
      plugins: {
        viewContext: {
          pageTitle: 'Change your password',
          activeNavLink: 'change-password'
        },
        licenceLoader: {
          loadUserLicenceCount: true
        },
        reauth: true
      }
    }
  },
  {
    method: 'POST',
    path: '/account/update-password/new',
    config: {
      description: 'Update password: set new password',
      validate: {
        payload: {
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
            csrf_token: VALID_GUID
          },
          options: {
            abortEarly: false
          }
        },
        licenceLoader: {
          loadUserLicenceCount: true
        },
        reauth: true
      }
    },
    handler: controller.postSetPassword
  },

  permanentRedirectFactory('/password_updated', '/account/update-password/success'),

  {
    method: 'GET',
    path: '/account/update-password/success',
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
