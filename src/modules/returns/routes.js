const Joi = require('joi');
const controller = require('./controller');

module.exports = {
  getLicenceReturns: {
    method: 'GET',
    path: '/returns',
    handler: controller.getReturns,
    config: {
      description: 'Displays a list of returns for the current licence holder',
      plugins: {
        viewContext: {
          pageTitle: 'Your returns',
          activeNavLink: 'returns'
        }
      }
    }
  },

  getReturn: {
    method: 'GET',
    path: '/returns/return',
    handler: controller.getReturn,
    config: {
      description: 'Displays data for a single return',
      validate: {
        query: {
          id: Joi.string().required()
        }
      },
      plugins: {
        viewContext: {
          activeNavLink: 'returns'
        }
      }
    }
  }
};
