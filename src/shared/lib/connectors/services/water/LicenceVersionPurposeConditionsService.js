const ServiceClient = require('../ServiceClient')

class LicenceVersionPurposeConditionsService extends ServiceClient {
  getLicenceVersionPurposeConditionById (lvpcId, options = {}) {
    const url = this.joinUrl('licence-version-purpose-conditions', lvpcId)
    return this.serviceRequest.get(url, options)
  }

  getLicenceVersionPurposeConditionsByLicenceId (licenceId, options = {}) {
    const url = this.joinUrl('licences', licenceId, 'licence-version-purpose-conditions')
    return this.serviceRequest.get(url, options)
  }
}

module.exports = LicenceVersionPurposeConditionsService
