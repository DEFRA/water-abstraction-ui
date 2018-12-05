const { get } = require('lodash');
const { hasPermission } = require('../permissions');

const isAuthenticated = request => !!get(request, 'state.sid');
const isAdmin = request => hasPermission('admin.defra', request.permissions);

const contactLink = {
  id: 'contact-information',
  text: 'Contact information',
  href: '/admin/contact-information'
};

const changePasswordLink = {
  id: 'change-password',
  text: 'Change password',
  href: '/update_password'
};

const signoutLink = {
  id: 'signout',
  text: 'Sign out',
  href: '/signout'
};

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

  return links.map(link => ({
    ...link,
    active: link.id === activeNavLink,
    attributes: {
      id: link.id
    }
  }));
};

module.exports = {
  getPropositionLinks
};
