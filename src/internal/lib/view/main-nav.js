const { get } = require('lodash');

const {
  isAnyAR, isExternalReturns, isPrimaryUser, isAuthenticated, isInternal
} = require('../permissions');

const { createLink, setActiveLink } = require('./helpers');

const createNavLink = (label, path, id) => {
  return createLink(label, path, id, { id: `navbar-${id}` });
};

// Internal links
const internalLinks = {
  licences: createNavLink('Licences', '/licences', 'view'),
  ar: createNavLink('Digitise!', '/digitise', 'ar'),
  notifications: createNavLink('Reports and notifications', '/notifications', 'notifications')
};

const externalLinks = {
  licences: createNavLink('View licences', '/licences', 'view'),
  returns: createNavLink('Manage returns', '/returns', 'returns'),
  manage: createNavLink('Add licences or give access', '/manage_licences', 'manage')
};

/**
 * Get links for internal staff
 * @param  {Object} request - HAPI request instance
 * @return {Array}         - array of links
 */
const getInternalNav = (request) => {
  const links = [internalLinks.licences];
  if (isAnyAR(request)) {
    links.push(internalLinks.ar);
  }
  links.push(internalLinks.notifications);
  return links;
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
    if (isExternalReturns(request)) {
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

  const getNav = isInternal(request) ? getInternalNav : getExternalNav;
  const links = getNav(request);

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink');
  return setActiveLink(links, activeNavLink);
};

module.exports = {
  getMainNav
};
