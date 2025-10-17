const { get } = require('lodash')

const { isAnyAR, isAuthenticated, isBilling, isManageTab, isNotices } = require('../permissions')
const { createLink, setActiveLink } = require('./helpers')

const createNavLink = (label, path, id) => {
  return createLink(label, path, id, { id: `navbar-${id}` })
}

// Internal links
const getAvailableLinks = () => {
  return {
    licences: createNavLink('Search', '/licences', 'view'),
    billRuns: createNavLink('Bill runs', '/system/bill-runs', 'bill-runs'),
    ar: createNavLink('Digitise!', '/digitise', 'ar'),
    notifications: createNavLink('Manage', '/system/manage', 'notifications'),
    notices: createLink('Notices', '/system/notices', 'notices')
  }
}

/**
 * Get links that the current user is authorised to see.
 * @param  {Object} request - HAPI request instance
 * @return {Array}         - array of links
 */
const getNavigationForUser = (request) => {
  const availableLinks = getAvailableLinks()
  const links = [availableLinks.licences]

  if (isBilling(request)) {
    links.push(availableLinks.billRuns)
  }
  if (isAnyAR(request)) {
    links.push(availableLinks.ar)
  }
  if (isNotices(request)) {
    links.push(availableLinks.notices)
  }
  if (isManageTab(request)) {
    links.push(availableLinks.notifications)
  }

  return links
}

/**
 * Gets main nav links for displaying tabs
 * @param  {Object} request - HAPI request instance
 * @return {Array} - array of nav links
 */
const getMainNav = (request) => {
  if (!isAuthenticated(request)) {
    return []
  }

  const links = getNavigationForUser(request)

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink')
  return setActiveLink(links, activeNavLink)
}

exports.getMainNav = getMainNav
