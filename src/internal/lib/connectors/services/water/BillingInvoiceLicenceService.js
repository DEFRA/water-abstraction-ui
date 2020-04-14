const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class BillingInvoiceLicenceService extends ServiceClient {
  getInvoiceLicence (invoiceLicenceId) {
    const uri = this.joinUrl('billing/invoice-licences', invoiceLicenceId);
    return this.serviceRequest.get(uri);
  }

  getInvoice (invoiceLicenceId) {
    const uri = this.joinUrl('billing/invoice-licences', invoiceLicenceId, '/invoice');
    return this.serviceRequest.get(uri);
  }

  deleteInvoiceLicence (invoiceLicenceId) {
    const uri = this.joinUrl('billing/invoice-licences', invoiceLicenceId);
    return this.serviceRequest.delete(uri);
  }
}

module.exports = BillingInvoiceLicenceService;
