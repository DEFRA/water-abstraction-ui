const controller = require('./controller');

module.exports = {

  getLicence: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}',
    handler: controller.getLicence,
    config: {
      description: 'Page to view comparison of permit repo licence with AR version',
      plugins: {
        viewContext: {
          pageTitle: 'View licence'
        }
      }
    }
  }

};
