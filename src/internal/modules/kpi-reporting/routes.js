const controller = require('./controller')
const { hasManageTab } = require('internal/lib/constants').scope

module.exports = {
  getKpiReporting: {
    method: 'GET',
    path: '/reporting/kpi-reporting',
    handler: controller.getKPIDashboard,
    config: {
      auth: { scope: hasManageTab },
      plugins: {
        viewContext: {
          pageTitle: 'Manage your water abstraction and impoundment licence',
          caption: 'Dashboard'
        }
      }
    }
  }
}
