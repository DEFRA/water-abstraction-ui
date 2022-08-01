'use strict'

/**
 * Predicate to check if supplied licence version has "current" status
 *
 * @param {Object} licenceVersion
 * @returns {Boolean}
 */
const isCurrentVersion = licenceVersion => licenceVersion.status === 'current'

/**
 * Compares licence versions a and b to determine the sort order
 *
 * @param {Object} a
 * @param {Object} b
 * @returns {Number}
 */
const compareFunction = (a, b) => {
  if (b.issue > a.issue) {
    return 1
  }
  if (
    (b.issue === a.issue) &&
    (b.increment > a.increment)
  ) {
    return 1
  }
  return -1
}

class LicenceDataService {
  constructor (waterApiConnector) {
    this.licencesApiConnector = waterApiConnector.licences
    this.chargeVersionWorkflowsApiConnector = waterApiConnector.chargeVersionWorkflows
  }

  getLicenceById (licenceId) {
    return this.licencesApiConnector.getLicenceById(licenceId)
  }

  getDocumentByLicenceId (licenceId) {
    return this.licencesApiConnector.getDocumentByLicenceId(licenceId)
  }

  async loadLicenceVersionsByLicenceId (licenceId) {
    return this.licencesApiConnector.getLicenceVersions(licenceId)
  }

  /**
   * Gets default licence version given a licence ID
   * The default is either "current", or the last version
   *
   * @param {String} licenceId
   * @returns {Promise<Object>}
   */
  async getDefaultLicenceVersionByLicenceId (licenceId) {
    // Load all licence versions
    const licenceVersions = await this.licencesApiConnector.getLicenceVersions(licenceId)
    // Use the version with "current" status if found
    const currentVersion = licenceVersions.find(isCurrentVersion)
    // Otherwise use the version with the greatest issue/increment
    const licenceVersion = currentVersion || licenceVersions.sort(compareFunction).pop()

    return {
      ...licenceVersion,
      licenceVersions
    }
  }

  getChargeVersionsByLicenceId (licenceId) {
    return this.licencesApiConnector.getChargeVersionsByLicenceId(licenceId)
  }

  getChargeVersionWorkflowsByLicenceId (licenceId) {
    return this.chargeVersionWorkflowsApiConnector.getChargeVersionWorkflowsForLicence(licenceId)
  }

  getInvoicesByLicenceId (licenceId, page, perPage) {
    return this.licencesApiConnector.getInvoicesByLicenceId(licenceId, page, perPage)
  }

  getAgreementsByLicenceId (licenceId, page, perPage) {
    return this.licencesApiConnector.getLicenceAgreements(licenceId, page, perPage)
  }

  getReturnsByLicenceId (licenceId, page, perPage) {
    return this.licencesApiConnector.getReturnsByLicenceId(licenceId, page, perPage)
  }

  getNotificationsByLicenceId (licenceId, page, perPage) {
    return this.licencesApiConnector.getNotificationsByLicenceId(licenceId, page, perPage)
  }
}

module.exports = LicenceDataService
