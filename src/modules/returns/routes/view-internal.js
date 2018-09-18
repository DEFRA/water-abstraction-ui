const Joi = require('joi');
const { getReturnsForLicence, getReturn } = require('./view');

module.exports = {
  getAdminReturnsForLicence: {
    ...getReturnsForLicence,
    path: '/admin/licences/{documentId}/returns',
    config: {
      ...getReturnsForLicence.config,
      auth: {
        scope: ['internal']
      }
    }
  },

  getAdminReturn: {
    ...getReturn,
    path: '/admin/returns/return',
    config: {
      ...getReturn.config,
      validate: {
        query: {
          id: Joi.string().required(),
          version: Joi.number().optional().min(1)
        }
      },
      auth: {
        scope: ['internal']
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view',
          showMeta: true
        }
      }
    }
  }
};
