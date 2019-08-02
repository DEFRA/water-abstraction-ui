const Boom = require('boom');
const { scope: { hofNotifications, renewalNotifications } } = require('../../../lib/constants');
const { hasScope } = require('../../../lib/permissions');

/**
 * Defines which scope is required to view each of the 4 notification types
 * @type {Object}
 */
const notificationScopes = {
  'hof-resume': hofNotifications,
  'hof-stop': hofNotifications,
  'hof-warning': hofNotifications,
  renewal: renewalNotifications
};

/**
 * Returns the scope that is needed for a user to send the supplied notification
 * @param  {Object} task - task config from water service
 * @return {String}        scope
 */
const getNotificationScope = task => {
  const { subtype } = task;
  if (!(subtype in notificationScopes)) {
    throw new Error(`Permissions not found for notification task subtype ${task}`);
  }
  return notificationScopes[subtype];
};

/**
 * Checks access for the specified task on the current request
 * If the user does not have access, throws a Boom unauthorized error
 * @param  {Object} request
 * @param  {Object} task - task config from water service
 */
const checkAccess = (request, task) => {
  const scope = getNotificationScope(task);
  if (!hasScope(request, scope)) {
    throw Boom.unauthorized(`Access denied to notification task ${task.task_config_id}`, request.defra);
  }
};

exports.getNotificationScope = getNotificationScope;
exports.checkAccess = checkAccess;
