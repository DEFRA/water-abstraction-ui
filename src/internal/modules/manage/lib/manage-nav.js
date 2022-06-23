/**
 * Contains functions to help with building a list of notifications that
 * can be sent by the current authenticated user
 */
const { hasScope } = require('../../../lib/permissions')
const { scope } = require('../../../lib/constants')
const { featureToggles } = require('../../../config')
const { mapValues } = require('lodash')

/**
 * Creates a link object for the manage tab view
 * @param  {String} name   - link text
 * @param  {String} path   - link path
 * @param  {Array} scopes  - a list of scopes which can access this link
 * @return {Object}          link object
 */
const createLink = (name, path, scopes) => ({ name, path, scopes })

/**
 * Gets a skeleton object for the manage tab view
 * @type {Object}
 */
const manageTabSkeleton = () => ({
  reports: [
    createLink('Notices', '/notifications/report', scope.allNotifications),
    createLink('Returns cycles', '/returns-reports', scope.returns),
    createLink('Digitise!', '/digitise/report', scope.abstractionReformApprover),
    createLink('Charging forecast report', '/reporting/charging-forecast-reports', scope.billing),
    createLink('Key performance indicators', '/reporting/kpi-reporting', scope.hasManageTab)
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
  uploadChargeInformation: [
    createLink('Upload a file', '/charge-information/upload', featureToggles.allowChargeVersionUploads && scope.chargeVersionWorkflowReviewer)
  ],
  accounts: [
    createLink('Create an internal account', '/account/create-user', scope.manageAccounts)
  ],
  chargeInformationWorkflow: [
    createLink('Check licences in workflow', '/charge-information-workflow', [
      scope.chargeVersionWorkflowEditor,
      scope.chargeVersionWorkflowReviewer
    ])
  ]
})

/**
 * Get a config object for the current user's manage tab
 * by filtering the skeleton items by scope
 * @param  {Object} request
 * @return {[type]}         [description]
 */
const getManageTabConfig = request => mapValues(
  manageTabSkeleton(),
  links => links.filter(link => hasScope(request, link.scopes))
)

exports.getManageTabConfig = getManageTabConfig
