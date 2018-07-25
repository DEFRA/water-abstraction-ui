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
  }
};
