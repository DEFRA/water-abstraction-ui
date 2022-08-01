const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class KpiReportingService extends ServiceClient {
  getKpiData () {
    const url = this.joinUrl('kpi-reporting')
    return this.serviceRequest.get(url)
  };
}

module.exports = KpiReportingService
