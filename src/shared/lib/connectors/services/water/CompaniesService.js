const moment = require('moment')

const ServiceClient = require('../ServiceClient')

class CompaniesService extends ServiceClient {
  /**
   * Gets due returns for the specified company
   * @param  {String} entityId - company entity ID GUID
   * @return {Promise<Array>} resolves with an array of returns
   */
  getCurrentDueReturns (entityId) {
    const url = this.joinUrl('company', entityId, 'returns')

    // NOTE: This call will hit the /water/1.0/company/{entityId}/returns endpoint in water-abstraction-service. It will
    // make a request to water-abstraction-returns where these values will be added to the filter as
    //
    // const filters = {
    //   // ...
    //   endDate: { key: 'end_date.$lte', value: query.endDate },
    //   status: { key: 'status', value: query.status }
    // }
    //
    // Key is it applies a 'less than or equal to' clause to the query. The issue we found is
    //
    // - return log has an end date of 2025-06-30
    // - current date is 2025-06-30
    //
    // If the current date matches the end date of the return log, it will be returned.
    //
    // https://github.com/DEFRA/water-abstraction-ui/pull/2716 was created when we realised the UI was displaying these
    // returns in the external UI with a status of 'NOT DUE YET'. We shouldn't have displayed them because they are not
    // due to be submitted until 2025-07-01, the day after the return log period ends.
    //
    // The same applies to what return logs we include in the CSV.
    //
    // We could have amended the filter in water-abstraction-service to use `end_date.$lt` but we don't know what else
    // that endpoint is used for that we might break. So, instead, we've resolved the issue by altering the end date
    // value it is looking for. If we subtract a day from the current date the request will NOT include return logs
    // that end on the current date.
    const options = {
      qs: {
        status: 'due',
        endDate: moment().subtract(1, 'day').format('YYYY-MM-DD')
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
