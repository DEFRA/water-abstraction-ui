const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingInvoiceLicenceService extends ServiceClient {
  getInvoiceLicence (invoiceLicenceId) {
    const uri = this.joinUrl('billing/invoice-licences', invoiceLicenceId);
    return this.serviceRequest.get(uri);
  }
}

module.exports = BillingInvoiceLicenceService;
