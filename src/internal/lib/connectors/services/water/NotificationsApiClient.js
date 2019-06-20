const SharedNotificationsApiClient = require('shared/lib/connectors/services/water/NotificationsApiClient');
const urlJoin = require('url-join');
const { serviceRequest } = require('@envage/water-abstraction-helpers');

class NotificationsApiClient extends SharedNotificationsApiClient {
  /**
   * Send/preview notifications.  Builds de-duped contact list and renders templates
   * @param {Number} taskConfigId - the task ID in the water service task_config table
   * @param {Array} licenceNumbers - an array of licence numbers
   * @param {Object} params - user-entered template parameters
   * @param {String} sender - email address of sender.  If not supplied, reverts to preview mode
   * @return {Promise} resolves with an array of contacts, each with licence numbers and rendered templates attached
   */
  sendNotification (taskConfigId, licenceNumbers, params = {}, sender = null) {
    const url = urlJoin(this.config.serviceUrl, 'notification', sender ? 'send' : 'preview');
    const options = {
      body: {
        filter: {
          system_external_id: {
            $in: licenceNumbers
          }
        },
        taskConfigId,
        params,
        sender
      }
    };
    return serviceRequest.post(url, options);
  };
};

module.exports = NotificationsApiClient;
