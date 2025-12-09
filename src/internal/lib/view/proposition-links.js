const { get } = require('lodash')
const { createLink, setActiveLink } = require('./helpers')

const {
  isAuthenticated,
  isHofOrRenewalNotifications
} = require('../permissions')

const createPropositionLink = (label, path, id) => {
  return createLink(label, path, id, { id })
}

const changePasswordLink = createPropositionLink('Change password', '/account/update-password', 'change-password')
const signoutLink = createPropositionLink('Sign out', '/signout', 'signout')

/**
 * Given a HAPI request instance, provides a list of links for the
 * proposition links area in the GOV.UK frontend
 * @param  {Object} request HAPI request
 * @return {Array}         list of links
 */
const getPropositionLinks = (request) => {
  if (!isAuthenticated(request)) {
    return []
  }

  const links = []

  if (isHofOrRenewalNotifications(request)) {
    links.push(_contactLink())
  }
  links.push(changePasswordLink, signoutLink)

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink')
  return setActiveLink(links, activeNavLink)
}

function _contactLink () {
  return createPropositionLink('Profile details', '/system/users/me/profile-details', 'profile-details')
}

exports.getPropositionLinks = getPropositionLinks
