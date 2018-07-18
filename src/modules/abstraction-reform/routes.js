const controller = require('./controller');

module.exports = {

  getViewLicence: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}',
    handler: controller.getViewLicence,
    config: {
      description: 'Page to view comparison of permit repo licence with AR version',
      plugins: {
        viewContext: {
          pageTitle: 'View licence'
        }
      }
    }
  },

  getEditObject: {
    method: 'GET',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id}',
    handler: controller.getEditObject,
    config: {
      description: 'Edit an object within the licence',
      plugins: {
        viewContext: {
          pageTitle: 'Edit'
        }
      }
    }
  },

  postEditObject: {
    method: 'POST',
    path: '/admin/abstraction-reform/licence/{documentId}/edit/{type}/{id}',
    handler: controller.postEditObject,
    config: {
      description: 'Post handler: edit an object within the licence'
    }
  }

};
