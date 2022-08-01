'use strict'

const { parseDomain } = require('parse-domain')
const localHost = 'localhost'

/**
 * Gets the domain for Google Analytics cookies
 * @param {String} hostName
 * @returns {String}
 */
const getAnalyticsCookieDomain = hostName => {
  if (hostName.includes(localHost)) {
    return localHost
  }

  const { domain, topLevelDomains } = parseDomain(hostName)

  return `.${domain}.${topLevelDomains.join('.')}`
}

exports.getAnalyticsCookieDomain = getAnalyticsCookieDomain
