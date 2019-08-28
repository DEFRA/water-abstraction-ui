const Joi = require('@hapi/joi');
const { getReturnsForLicence, getReturn } = require('./view');
const { scope: { internal } } = require('../../../lib/constants');

module.exports = {
  getAdminReturnsForLicence: {
    ...getReturnsForLicence,
    path: '/licences/{documentId}/returns',
    config: {
      ...getReturnsForLicence.config,
      auth: {
        scope: internal
      }
    }
  },

  getAdminReturn: {
    ...getReturn,
    path: '/returns/return',
    config: {
      ...getReturn.config,
      validate: {
        query: {
          id: Joi.string().required(),
          version: Joi.number().optional().min(1)
        }
      },
      auth: {
        scope: internal
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
