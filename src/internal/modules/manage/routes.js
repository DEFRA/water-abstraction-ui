const controller = require('./controller');
const { scope } = require('internal/lib/constants');

module.exports = [

  {
    method: 'GET',
    path: '/manage',
    config: {
      auth: {
        scope: scope.hasManageTab
      },
      description: 'Manage tab',
      plugins: {
        viewContext: {
          pageTitle: 'Manage reports and notices',
          activeNavLink: 'notifications'
        }
      }
    },
    handler: controller.getManageTab
  }
];
