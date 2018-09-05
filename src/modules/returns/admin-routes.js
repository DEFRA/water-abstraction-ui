const { getReturnsForLicence, getReturn } = require('./external-routes');

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
      auth: {
        scope: ['internal']
      },
      plugins: {
        viewContext: {
          activeNavLink: 'view'
        }
      }
    }
  }
};
