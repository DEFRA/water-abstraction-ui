const Joi = require('joi');
const contactController = require('./contact-controller');
const { VALID_EMAIL } = require('../../lib/validators');

module.exports = {
  getNameAndJob: {
    method: 'GET',
    path: '/admin/notifications/contact',
    handler: contactController.getNameAndJob,
    config: {
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
    path: '/admin/notifications/contact',
    handler: contactController.postNameAndJob,
    config: {
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
          }
        }
      }
    }
  },

  getDetails: {
    method: 'GET',
    path: '/admin/notifications/contact-details',
    handler: contactController.getDetails,
    config: {
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
    path: '/admin/notifications/contact-details',
    handler: contactController.postDetails,
    config: {
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
