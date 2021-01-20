const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class InvoiceAccountService extends ServiceClient {
  /**
   * Get invoice account by ID
   * @param {String} invoiceAccountId
   */
  getInvoiceAccount (invoiceAccountId) {
    const uri = this.joinUrl('invoice-accounts', invoiceAccountId);
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
    const uri = this.joinUrl('invoice-accounts', invoiceAccountId, 'addresses');
    return this.serviceRequest.post(uri, data);
  }
}

module.exports = InvoiceAccountService;
