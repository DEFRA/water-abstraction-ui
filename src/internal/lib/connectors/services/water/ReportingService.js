const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class ReportingService extends ServiceClient {
  getReportSignedUrl (reportIdentifier) {
    const url = this.joinUrl('report/', reportIdentifier);
    return this.serviceRequest.get(url);
  };
}

module.exports = ReportingService;
