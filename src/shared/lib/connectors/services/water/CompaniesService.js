const ServiceClient = require('../ServiceClient')
const { last } = require('lodash')
const { returns: { date: { createReturnCycles } } } = require('@envage/water-abstraction-helpers')

//added Moment
const moment = require('moment')

class CompaniesService extends ServiceClient {
  /**
   * Gets due returns in the current returns cycle for the specified company
   * @param  {String} entityId - company entity ID GUID
   * @return {Promise<Array>} resolves with an array of returns
   */
  getCurrentDueReturns (entityId) {
    let currentCycle = last(createReturnCycles())
    console.log(currentCycle)
   /* 
    currentCycle =
    {
     'startDate': '2023-04-01',
    'endDate': '2024-03-31',
     'isSummer': false,
     'dueDate': '2024-04-28'
      }
*/

    const url = this.joinUrl('company', entityId, 'returns')

    console.log("The url " + url)
    const options = {
      qs: {
        //startDate: moment().subtract(9, 'months').format('YYYY-MM-DD'), //currentCycle.startDate, Get any returns that started less than a year ago
        //endDate: moment().format('YYYY-MM-DD'), //currentCycle.endDate,  Get any returns that have now ended.
       // dueDate: moment().subtract(1, 'years').format('YYYY-MM-DD'), //get any return with the due date less than a year
       // isSummer: currentCycle.isSummer,
        status: 'due'
      }
    }
    return this.serviceRequest.get(url, options)
  }

  getContacts (entityId) {
    const url = this.joinUrl('companies', entityId, 'contacts')
    return this.serviceRequest.get(url)
  }

  postCompanyContact (companyId, contactId, roleName) {
    const url = this.joinUrl('companies', companyId, 'contacts')
    return this.serviceRequest.post(url, {
      body: {
        contactId,
        roleName
      }
    })
  }

  patchCompanyContact (companyId, contactId, payload) {
    const url = this.joinUrl('companies', companyId, 'contacts', contactId)
    return this.serviceRequest.patch(url, { body: payload })
  }

  deleteCompanyContact (companyId, contactId) {
    const url = this.joinUrl('companies', companyId, 'contacts', contactId)
    return this.serviceRequest.delete(url)
  }

  getAddresses (entityId) {
    const url = this.joinUrl('companies', entityId, 'addresses')
    return this.serviceRequest.get(url)
  }

  getCompany (entityId) {
    const url = this.joinUrl('companies', entityId)
    return this.serviceRequest.get(url)
  }

  postInvoiceAccount (entityId, body) {
    const url = this.joinUrl('companies', entityId, 'invoice-accounts')
    return this.serviceRequest.post(url, { body })
  }

  getCompaniesByName (name) {
    const url = this.joinUrl('companies/search')
    const options = {
      qs: {
        name
      }
    }
    return this.serviceRequest.get(url, options)
  };

  getCompaniesFromCompaniesHouse (q) {
    const url = this.joinUrl('companies-house/search/companies')
    const options = {
      qs: {
        q
      }
    }
    return this.serviceRequest.get(url, options)
  };

  getCompanyFromCompaniesHouse (companyNumber) {
    const url = this.joinUrl('companies-house/companies', companyNumber)
    return this.serviceRequest.get(url)
  }

  getCompanyInvoiceAccounts (companyId, regionId) {
    const options = {
      qs: {
        regionId
      }
    }
    const url = this.joinUrl('companies', companyId, 'invoice-accounts')
    return this.serviceRequest.get(url, options)
  }

  getCompanyLicences (companyId) {
    const url = this.joinUrl('companies', companyId, 'licences')
    return this.serviceRequest.get(url)
  }
}

module.exports = CompaniesService
