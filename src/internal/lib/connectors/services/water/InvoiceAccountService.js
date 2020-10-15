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
}

module.exports = InvoiceAccountService;
