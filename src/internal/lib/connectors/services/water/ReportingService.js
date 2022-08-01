const ServiceClient = require('shared/lib/connectors/services/ServiceClient')
const got = require('got')

class ReportingService extends ServiceClient {
  /**
   * Requests a report from the API
   * @param userId {string} The user number
   * @param reportIdentifier {string} The report identifier
   * @returns {Request} Request body
   */
  getReport (userId, reportIdentifier) {
    const uri = this.joinUrl('report/', reportIdentifier)
    const options = {
      headers: {
        Authorization: `Bearer ${process.env.JWT_TOKEN}`,
        'defra-internal-user-id': `${userId}`
      }
    }

    return got.stream(uri, options)
  }
}

module.exports = ReportingService
