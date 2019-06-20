const { APIClient } = require('@envage/hapi-pg-rest-api');
const urlJoin = require('url-join');
const { http, serviceRequest } = require('@envage/water-abstraction-helpers');

const getEndpoint = serviceUrl => urlJoin(serviceUrl, 'notification');

class NotificationsApiClient extends APIClient {
  /**
   * Create a new instance of a NotificationsApiClient
   * @param {Object} config Object containing the services.water url and the jwt.token value
   * @param {Object} logger The system logger object
   */
  constructor (config, logger) {
    const serviceUrl = config.services.water;

    super(http.request, {
      serviceUrl,
      endpoint: getEndpoint(serviceUrl),
      logger,
      headers: {
        Authorization: config.jwt.token
      }
    });
  }

  /**
   * Gets the most recent notification for the given email address.
   * @param {String} emailAddress
   */
  getLatestEmailByAddress (emailAddress) {
    const filter = { recipient: emailAddress, message_type: 'email' };
    const sort = { send_after: -1 };
    const pagination = { page: 1, perPage: 1 };
    return this.findMany(filter, sort, pagination);
  };

  async sendNotifyMessage (messageRef, recipient, personalisation) {
    const url = urlJoin(this.config.serviceUrl, 'notify', messageRef);
    const body = { recipient, personalisation };

    try {
      const response = await serviceRequest.post(url, { body });
      return response.body;
    } catch (err) {
      this.logger.error('Error sending notify message', { error: err });
      return err;
    };
  }
};

module.exports = NotificationsApiClient;
