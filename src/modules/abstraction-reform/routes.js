const Joi = require('joi');
const controller = require('./controller');
const statuses = require('./lib/statuses');
const { scope } = require('../../lib/constants');
const allowedScopes = [scope.abstractionReformUser, scope.abstractionReformApprover];

module.exports = {

  getViewLicences: {
    method: 'GET',
    path: '/admin/abstraction-reform',
    handler: controller.getViewLicences,
    options: {
      auth: { scope: allowedScopes },
      description: 'Entrance search page for abstraction reform',
      validate: {
        query: {
          page: Joi.number().default(1),
          q: Joi.string().allow('')
        }
      },
      plugins: {
        viewContext: {
          pageTitle: 'Review licence data',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getViewLicence: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}',
    handler: controller.getViewLicence,
    options: {
      auth: { scope: allowedScopes },
      description: 'Page to view comparison of permit repo licence with AR version',
      plugins: {
        viewContext: {
          pageTitle: 'View licence',
          activeNavLink: 'ar'
        }
      }
    }
  },

  getEditObject: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id?}',
    handler: controller.getEditObject,
    options: {
      auth: { scope: allowedScopes },
      description: 'Edit an object within the licence',
      plugins: {
        viewContext: {
          pageTitle: 'Edit',
          activeNavLink: 'ar'
        }
      }
    }
  },

  postEditObject: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id?}',
    handler: controller.postEditObject,
    options: {
      auth: { scope: allowedScopes },
      description: 'Post handler: edit an object within the licence'
    }
  },

  postSetStatus: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/status',
    handler: controller.postSetStatus,
    options: {
      auth: { scope: allowedScopes },
      description: 'Post handler: set document status',
      plugins: {
        formValidator: {
          payload: {
            csrf_token: Joi.string().guid(),
            notes: Joi.string().allow(''),
            status: Joi.string().required().valid(Object.values(statuses))
          }
        }
      }
    }
  }
};
