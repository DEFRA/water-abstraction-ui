const controller = require('./controller');
const constants = require('../../lib/constants');
const returns = constants.scope.returns;

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/admin/returns-reports',
    handler: controller.getReturns,
    config: {
      auth: { scope: returns },
      description: 'View overview of all returns cycles',
      plugins: {
        viewContext: {
          activeNavLink: 'notifications',
          pageTitle: 'Returns overview'
        }
      }
    }
  }

};
