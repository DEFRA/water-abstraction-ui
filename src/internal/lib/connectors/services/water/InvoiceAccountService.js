const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

const pathPrefix = 'invoice-accounts';

class InvoiceAccountService extends ServiceClient {
  /**
   * Get invoice account by ID
   * @param {String} invoiceAccountId
   */
  getInvoiceAccount (invoiceAccountId) {
    const uri = this.joinUrl(pathPrefix, invoiceAccountId);
    return this.serviceRequest.get(uri);
  }

  /**
   * Creates a new invoice account address record
   * @param {String} invoiceAccountId
   * @param {Object} data
   * @param {Object|Null} data.agent - company record for agent
   * @param {Object|Null} data.contact - FAO
   * @param {Object} data.address
   */
  createInvoiceAccountAddress (invoiceAccountId, data) {
    const uri = this.joinUrl(pathPrefix, invoiceAccountId, 'addresses');
    return this.serviceRequest.post(uri, { body: data });
  }

  /**
   * Gets licences currently linked to the supplied invoice account
   * via charge versions
   * @param {String} invoiceAccountId
   */
  getLicences (invoiceAccountId) {
    const uri = this.joinUrl(pathPrefix, invoiceAccountId, 'licences');
    return this.serviceRequest.get(uri);
  }
}

module.exports = InvoiceAccountService;
