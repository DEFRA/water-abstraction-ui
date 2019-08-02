const Joi = require('@hapi/joi');
const contactController = require('./contact-controller');
const { VALID_EMAIL } = require('shared/lib/validators');
const constants = require('../../lib/constants');
const { hofNotifications, renewalNotifications } = constants.scope;

const allowedScopes = [hofNotifications, renewalNotifications];

module.exports = {
  getNameAndJob: {
    method: 'GET',
    path: '/notifications/contact',
    handler: contactController.getNameAndJob,
    config: {
      auth: { scope: allowedScopes },
      description: 'Display contact details form if not already set in notifications flow',
      validate: {
        query: {
          redirect: Joi.string()
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postNameAndJob: {
    method: 'POST',
    path: '/notifications/contact',
    handler: contactController.postNameAndJob,
    config: {
      auth: { scope: allowedScopes },
      description: 'Post handler for name and job title',
      validate: {
        payload: {
          'csrf_token': Joi.string().guid().required(),
          'redirect': Joi.string().allow(''),
          'contact-name': Joi.string().allow('').max(254),
          'contact-job-title': Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        },
        formValidator: {
          payload: {
            'contact-name': Joi.string().required(),
            'contact-job-title': Joi.string().required(),
            'csrf_token': Joi.string().guid().required(),
            'redirect': Joi.string().allow('')
          },
          options: {
            abortEarly: false
          }
        }
      }
    }
  },

  getDetails: {
    method: 'GET',
    path: '/notifications/contact-details',
    handler: contactController.getDetails,
    config: {
      auth: { scope: allowedScopes },
      description: 'Next page of notification contact details - email, tel, address',
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        }
      }
    }
  },

  postDetails: {
    method: 'POST',
    path: '/notifications/contact-details',
    handler: contactController.postDetails,
    config: {
      auth: { scope: allowedScopes },
      description: 'Post handler for email/tel/address',
      validate: {
        payload: {
          'csrf_token': Joi.string().guid().required(),
          'contact-tel': Joi.string().allow('').max(254),
          'contact-email': Joi.string().allow('').max(254),
          'contact-address': Joi.string().allow('').max(254)
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Add your contact information',
          activeNavLink: 'notifications'
        },
        formValidator: {
          options: {
            abortEarly: false
          },
          payload: {
            'csrf_token': Joi.string().guid().required(),
            'contact-email': VALID_EMAIL,
            'contact-tel': Joi.string().required(),
            'contact-address': Joi.string().required()
          }
        }
      }
    }
  }
};
