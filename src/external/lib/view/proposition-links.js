const { get } = require('lodash');
const { createLink, setActiveLink } = require('./helpers');

const { isAuthenticated } = require('../permissions');

const createPropositionLink = (label, path, id) => {
  return createLink(label, path, id, { id });
};

const changePasswordLink = createPropositionLink('Change password', '/update_password', 'change-password');
const signoutLink = createPropositionLink('Sign out', '/signout', 'signout');

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

  const links = [changePasswordLink, signoutLink];

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink');
  return setActiveLink(links, activeNavLink);
};

module.exports = {
  getPropositionLinks
};
