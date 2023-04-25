const ServiceClient = require('shared/lib/connectors/services/ServiceClient')

class ReportingService extends ServiceClient {
  /**
   * Requests a report from the API
   * @param userId {string} The user number
   * @param reportIdentifier {string} The report identifier
   * @returns {Request} Request body
   */
  async getReport (userId, reportIdentifier) {
    const { got } = await import('got')

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
