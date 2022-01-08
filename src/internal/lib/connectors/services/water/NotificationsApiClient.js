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

  /**
   * Gets a list of notifications
   * @param {Number} page
   * @param categories Either an array, or a single string (optional)
   * @param sender An email address (optional)
   */
  getNotifications (page = 1, categories, sender) {
    const url = urlJoin(this.config.serviceUrl, 'notifications');

    const parsedCategoriesString = Array.isArray(categories) ? categories.join(',') : categories;

    const options = {
      qs: {
        page,
        categories: parsedCategoriesString,
        sender
      }
    };
    return serviceRequest.get(url, options);
  }

  /**
   * Gets a single notification including the messages
   * @param {String} eventId
   */
  getNotification (eventId) {
    const url = urlJoin(this.config.serviceUrl, 'notifications', eventId);
    return serviceRequest.get(url);
  }

  /**
   * Gets a messages relating to a single notification
   * @param {String} eventId
   */
  getNotificationMessages (eventId) {
    const url = urlJoin(this.config.serviceUrl, 'notifications', eventId, 'messages');
    return serviceRequest.get(url);
  }

  /**
   * Gets a specific message by its ID
   * @param {String} id
   */
  getNotificationMessage (id) {
    const url = urlJoin(this.config.serviceUrl, 'notifications', id, 'message');
    return serviceRequest.get(url);
  }

  getNotificationCategories () {
    const url = urlJoin(this.config.serviceUrl, 'notifications/categories');
    return serviceRequest.get(url);
  }
};

module.exports = NotificationsApiClient;
