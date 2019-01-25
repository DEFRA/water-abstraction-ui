const Joi = require('joi');
const controller = require('./controller');
const { scope } = require('../../lib/constants');
const allowedScopes = scope.internal;

module.exports = {
  getSearchForm: {
    path: '/admin/licences',
    method: 'GET',
    handler: controller.getSearchForm,
    options: {
      auth: { scope: allowedScopes },
      description: 'Internal search',
      plugins: {
        viewContext: {
          pageTitle: 'Search licences, users and returns',
          activeNavLink: 'view'
        }
      },
      validate: {
        query: {
          query: Joi.string().allow(''),
          page: Joi.number().default(1).min(1)
        }
      }
    }
  }
};
