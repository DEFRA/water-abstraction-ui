const controller = require('./controller');

module.exports = {
  getKpiReporting: {
    method: 'GET',
    path: '/kpi-reporting',
    handler: controller.getKPIDashboard,
    config: {
      auth: {
        strategy: 'standard',
        mode: 'try'
      },
      plugins: {
        viewContext: {
          pageTitle: 'Manage your water abstraction and impoundment licence',
          caption: 'Dashboard'
        }
      }
    }
  }
};
