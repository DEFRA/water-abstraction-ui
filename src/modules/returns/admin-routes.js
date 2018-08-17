const { getReturnsForLicence, getReturn } = require('./external-routes');

module.exports = {
  getAdminReturnsForLicence: {
    ...getReturnsForLicence,
    path: '/admin/licences/{documentId}/returns',
    config: {
      ...getReturnsForLicence.config,
      auth: {
        scope: ['returns']
      }
    }
  },

  getAdminReturn: {
    ...getReturn,
    path: '/admin/returns/return',
    config: {
      ...getReturn.config,
      auth: {
        scope: ['returns']
      },
      plugins: {
        ...getReturn.config.plugins,
        viewContext: {
          ...getReturn.config.plugins.viewContext,
          activeNavLink: 'view'
        }
      }
    }
  }
};
