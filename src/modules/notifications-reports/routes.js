const controller = require('./controller');

module.exports = {

  getNotificationsList: {
    method: 'GET',
    path: '/admin/notifications/report',
    handler: controller.getNotificationsList,
    config: {
      description: 'View list of notifications sent',
      plugins: {
        viewContext: {
          pageTitle: 'Notification report'
        }
      }
    }
  }

};
