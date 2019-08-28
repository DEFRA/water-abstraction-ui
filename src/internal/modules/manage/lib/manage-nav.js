/**
 * Contains functions to help with building a list of notifications that
 * can be sent by the current authenticated user
 */
const { hasScope } = require('../../../lib/permissions');
const { scope } = require('../../../lib/constants');
const { mapValues } = require('lodash');

/**
 * Creates a link object for the manage tab view
 * @param  {String} name   - link text
 * @param  {String} path   - link path
 * @param  {Array} scopes  - a list of scopes which can access this link
 * @return {Object}          link object
 */
const createLink = (name, path, scopes) => ({ name, path, scopes });

/**
 * Gets a skeleton object for the manage tab view
 * @type {Object}
 */
const manageTabSkeleton = {
  reports: [
    createLink('Notices', '/notifications/report', scope.allNotifications),
    createLink('Returns cycles', '/returns-reports', scope.returns),
    createLink('Digitise!', '/digitise/report', scope.abstractionReformApprover)
  ],
  returnNotifications: [
    createLink('Invitations', '/returns-notifications/invitations', scope.bulkReturnNotifications),
    createLink('Paper forms', '/returns-notifications/forms', scope.returns),
    createLink('Reminders', '/returns-notifications/reminders', scope.bulkReturnNotifications)
  ],
  licenceNotifications: [
    createLink('Renewal', 'notifications/2?start=1', scope.renewalNotifications)
  ],
  hofNotifications: [
    createLink('Restriction', 'notifications/1?start=1', scope.hofNotifications),
    createLink('Hands-off flow', 'notifications/3?start=1', scope.hofNotifications),
    createLink('Resume', 'notifications/4?start=1', scope.hofNotifications)
  ],
  accounts: [
    createLink('Create an internal account', '/account/create-user', scope.manageAccounts)
  ]
};

/**
 * Get a config object for the current user's manage tab
 * @param  {Object} request
 * @param  {Array} tasks   - list of tasks from water service
 * @return {[type]}         [description]
 */
const getManageTabConfig = (request) => {
  // Filter skeleton items by scope
  return mapValues(manageTabSkeleton, (links, key) => {
    return links.filter(link => hasScope(request, link.scopes));
  });
};

exports.getManageTabConfig = getManageTabConfig;
