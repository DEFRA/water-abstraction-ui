const ServiceClient = require('shared/lib/connectors/services/ServiceClient');

class AgreementsService extends ServiceClient {
  getAgreement (agreementId) {
    const uri = this.joinUrl('agreements', agreementId);
    return this.serviceRequest.get(uri);
  }

  deleteAgreement (agreementId) {
    const uri = this.joinUrl('agreements', agreementId);
    return this.serviceRequest.delete(uri);
  }

  endAgreement (agreementId, data) {
    const uri = this.joinUrl('agreements', agreementId);
    return this.serviceRequest.patch(uri, { body: data });
  }
}

module.exports = AgreementsService;
