'use strict'

const Boom = require('@hapi/boom')
const services = require('../../lib/connectors/services')
const session = require('./lib/session')
const postcodeValidator = require('./lib/postcode-validator')

const excludeAddressesWithoutFullDetails = (addresses = []) => addresses.filter(address => (!!address.addressLine2 || !!address.addressLine3))

/**
 * Retrieves addresses for the specified postcode,
 * or a Boom 404 error if not found
 * @param {String} request.query.postcode - postcode entered by user
 * @param {Promise<Array>}
 */
const searchForAddressesByPostcode = async request => {
  const { error, value: postcode } = postcodeValidator.postcodeSchema.validate(request.query.postcode)

  if (!error) {
    try {
      const { data } = await services.water.addressSearch.getAddressSearchResults(postcode)

      // EA address facade can return some addresses with addressLine2 and addressLine3 as `null`
      // which causes validation to blow up downstream. This amendment was made as part of WATER-3269
      return excludeAddressesWithoutFullDetails(data)
    } catch (err) {
      if (err.statusCode === 404) {
        return Boom.notFound(`No addresses found for postcode ${postcode}`)
      }
      throw err
    }
  }
  return null
}

const getSessionDataFromRequest = request => {
  const { key } = request.params
  return session.get(request, key)
}

const getSessionData = request => {
  const data = getSessionDataFromRequest(request)
  return data || Boom.notFound(`Session data not found for ${request.params.key}`)
}

const getCompanyAddresses = request => {
  const { companyId } = getSessionDataFromRequest(request)
  return services.water.companies.getAddresses(companyId)
}

const getCompany = request => {
  const { companyId } = getSessionDataFromRequest(request)
  return services.water.companies.getCompany(companyId)
}

const getCompaniesHouseCompany = async request => {
  const { companyNumber } = getSessionDataFromRequest(request)
  return services.water.companies.getCompanyFromCompaniesHouse(companyNumber)
}

exports.searchForAddressesByPostcode = searchForAddressesByPostcode
exports.getSessionData = getSessionData
exports.getCompanyAddresses = getCompanyAddresses
exports.getCompany = getCompany
exports.getCompaniesHouseCompany = getCompaniesHouseCompany
