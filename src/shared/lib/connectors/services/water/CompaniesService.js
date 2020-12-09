const ServiceClient = require('../ServiceClient');
const { last } = require('lodash');
const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers');

class CompaniesService extends ServiceClient {
  /**
   * Gets due returns in the current returns cycle for the specified company
   * @param  {String} entityId - company entity ID GUID
   * @return {Promise<Array>} resolves with an array of returns
   */
  getCurrentDueReturns (entityId) {
    const currentCycle = last(createReturnCycles());
    const url = this.joinUrl('company', entityId, 'returns');
    const options = {
      qs: {
        startDate: currentCycle.startDate,
        endDate: currentCycle.endDate,
        isSummer: currentCycle.isSummer,
        status: 'due'
      }
    };
    return this.serviceRequest.get(url, options);
  }

  getContacts (entityId) {
    const url = this.joinUrl('companies', entityId, 'contacts');
    return this.serviceRequest.get(url);
  }

  getAddresses (entityId) {
    const url = this.joinUrl('companies', entityId, 'addresses');
    return this.serviceRequest.get(url);
  }

  getCompany (entityId) {
    const url = this.joinUrl('companies', entityId);
    return this.serviceRequest.get(url);
  }

  postInvoiceAccount (entityId, body) {
    const url = this.joinUrl('companies', entityId, 'invoice-accounts');
    return this.serviceRequest.post(url, { body });
  }

  getCompaniesByName (searchQuery) {
    const url = this.joinUrl(`companies/search?name=${searchQuery}`);
    return this.serviceRequest.get(url);
  };

  getCompaniesFromCompaniesHouse (searchQuery) {
    const url = this.joinUrl(`companies-house/search/companies?q=${searchQuery}`);
    return this.serviceRequest.get(url);
  };

  getCompanyFromCompaniesHouse (companyNumber) {
    const url = this.joinUrl(`companies-house/companies/${companyNumber}`);
    return this.serviceRequest.get(url);
  }
}
module.exports = CompaniesService;
