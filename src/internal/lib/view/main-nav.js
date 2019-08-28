const { get } = require('lodash');

const {
  isAnyAR, isAuthenticated, isManageTab
} = require('../permissions');

const { createLink, setActiveLink } = require('./helpers');

const createNavLink = (label, path, id) => {
  return createLink(label, path, id, { id: `navbar-${id}` });
};

// Internal links
const internalLinks = {
  licences: createNavLink('Licences', '/licences', 'view'),
  ar: createNavLink('Digitise!', '/digitise', 'ar'),
  notifications: createNavLink('Manage', '/manage', 'notifications')
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
  if (isManageTab(request)) {
    links.push(internalLinks.notifications);
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

  const links = getInternalNav(request);

  // Add active boolean to correct link
  const activeNavLink = get(request, 'view.activeNavLink');
  return setActiveLink(links, activeNavLink);
};

module.exports = {
  getMainNav
};
