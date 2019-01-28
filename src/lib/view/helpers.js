const { get } = require('lodash');
const { hasPermission } = require('../permissions');

const isAuthenticated = request => !!get(request, 'state.sid');
const isAdmin = request => hasPermission('admin.defra', request.permissions);
const isAr = request => hasPermission('ar.read', request.permissions);
const isInternalReturns = request => hasPermission('returns.edit', request.permissions);
const isExternalReturns = request => hasPermission('returns.submit', request.permissions);
const isPrimary = request => hasPermission('licences.edit', request.permissions);

/**
 * Creates a link object
 * @param  {String} text - The link text
 * @param  {String} href - The path / URL
 * @param  {String} id   - an ID which is used internally to highlight active nav
 * @param {Object} attributes - HTML attributes for link item
 * @return {Object}      link object
 */
const createLink = (text, href, id, attributes = {}) => {
  return {
    text,
    href,
    id,
    attributes
  };
};

/**
 * Sets the active link on a list of links
 * @param {Array} links - list of links
 * @param {String} activeNavLink    - the ID of the active link
 * @return {Array} links with active flag set
 */
const setActiveLink = (links, activeNavLink) => {
  return links.map(link => ({
    ...link,
    active: link.id === activeNavLink
  }));
};

module.exports = {
  isAuthenticated,
  isAdmin,
  createLink,
  isAr,
  isInternalReturns,
  isExternalReturns,
  isPrimary,
  setActiveLink
};
