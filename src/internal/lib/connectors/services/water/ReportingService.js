const ServiceClient = require('shared/lib/connectors/services/ServiceClient');
const got = require('got');

class ReportingService extends ServiceClient {
  /**
   * Requests a report from the API
   * @param request {Object} The request object
   * @returns {Request} Request body
   */
  getReport (request) {
    const { reportIdentifier } = request.params;
    const uri = this.joinUrl('report/', reportIdentifier);
    const options = {
      headers: {
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        'defra-internal-user-id': request.defra.userId
      }
    };

    return got.stream(uri, options);
  }
}

module.exports = ReportingService;
