'use strict'

const localHost = 'localhost'

/**
 * Gets the domain for Google Analytics cookies
 * @param {String} hostName
 * @returns {String}
 */
const getAnalyticsCookieDomain = async (hostName) => {
  if (hostName.includes(localHost)) {
    return localHost
  }

  const { parseDomain } = await import('parse-domain')
  const { domain, topLevelDomains } = parseDomain(hostName)

  return `.${domain}.${topLevelDomains.join('.')}`
}

exports.getAnalyticsCookieDomain = getAnalyticsCookieDomain
