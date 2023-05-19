'use strict'

const localHost = 'localhost'

/**
 * Gets the domain for Google Analytics cookies
 * @param {String} hostName
 * @returns {String}
 */
const getAnalyticsCookieDomain = (hostName) => {
  const domains = ['defra.cloud', 'manage-water-abstraction-impoundment-licence.service.gov.uk']
  let analyticsCookieDomain

  if (hostName.includes(localHost)) {
    return localHost
  }

  domains.forEach((domain) => {
    if (hostName.includes(domain)) {
      analyticsCookieDomain = domain
    }
  })

  return `.${analyticsCookieDomain}`
}

exports.getAnalyticsCookieDomain = getAnalyticsCookieDomain
