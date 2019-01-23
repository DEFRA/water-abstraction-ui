const { get } = require('lodash');
const { isAuthenticated, isAdmin, createLink, setActiveLink } = require('./helpers');

const contactLink = createLink('Contact information', '/admin/contact-information', 'contact-information');
const changePasswordLink = createLink('Change password', '/update_password', 'change-password');
const signoutLink = createLink('Sign out', '/signout', 'signout');

/**
 * Given a HAPI request instance, provides a list of links for the
 * proposition links area in the GOV.UK frontend
 * @param  {Object} request HAPI request
 * @return {Array}         list of links
 */
const getPropositionLinks = (request) => {
  if (!isAuthenticated(request)) {
    return [];
  }

  // Select links relevant to user type
  const links = isAdmin(request)
    ? [contactLink, changePasswordLink, signoutLink]
    : [changePasswordLink, signoutLink];

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink');
  return setActiveLink(links, activeNavLink);
};

module.exports = {
  getPropositionLinks
};
