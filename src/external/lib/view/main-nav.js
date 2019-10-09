const { get } = require('lodash');

const {
  isReturnsUser, isPrimaryUser, isAuthenticated
} = require('../permissions');

const { createLink, setActiveLink } = require('./helpers');

const createNavLink = (label, path, id) => {
  return createLink(label, path, id, { id: `navbar-${id}` });
};

const externalLinks = {
  licences: createNavLink('View licences', '/licences', 'view'),
  returns: createNavLink('Manage returns', '/returns', 'returns'),
  manage: createNavLink('Add licences or give access', '/manage_licences', 'manage')
};

/**
 * If a route is configured to load the user licence count,
 * there will be a number available at request.licence.userLicenceCount.
 *
 * If the route does not configure this setting, then assume that the
 * user does have licences.
 */
const userHasLicences = request => {
  return get(request, 'licence.userLicenceCount') !== 0;
};

/**
 * Get links for public users
 * @param  {Object} request - HAPI request instance
 * @return {Array}         array of links
 */
const getExternalNav = (request) => {
  const links = [externalLinks.licences];

  if (userHasLicences(request)) {
    if (isReturnsUser(request)) {
      links.push(externalLinks.returns);
    }

    if (isPrimaryUser(request)) {
      links.push(externalLinks.manage);
    }
  }
  return links;
};

/**
 * Gets main nav links for displaying tabs
 * @param  {Object} request - HAPI request instance
 * @return {Array} - array of nav links
 */
const getMainNav = (request) => {
  if (!isAuthenticated(request)) {
    return [];
  }

  const links = getExternalNav(request);

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink');
  return setActiveLink(links, activeNavLink);
};

module.exports = {
  getMainNav
};
