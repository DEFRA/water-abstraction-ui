const SharedNotificationsApiClient = require('shared/lib/connectors/services/water/NotificationsApiClient');
const addressFormatter = require('shared/lib/address-formatter');

class NotificationsApiClient extends SharedNotificationsApiClient {
  /**
  * Sends a letter contaning a security code to the user.
  * In environments other than production, this is skipped and the
  * the function always resolves.
  *
  * @param {Object} licence - licence document header data from CRM
  * @param {String} addressee - name of person to address letter to
  * @param {String} accesscode - code user receives in post to verify access
  * @return {Promise} resolves with object if successful
  */
  sendSecurityCode (licence, fao, accesscode) {
    // Get address components from licence
    const address = addressFormatter.createAddress(licence, fao);

    // Format personalisation with address lines and postcode
    const personalisation = Object.assign({}, address, {
      accesscode,
      siteaddress: process.env.BASE_URL,
      licenceholder: licence.metadata.Name,
      postcode: licence.metadata.Postcode
    });

    return this.sendNotifyMessage('security_code_letter', 'n/a', personalisation);
  }

  async sendAccessNotification (params) {
    let messageRef = 'share_existing_user';
    let link = `${process.env.BASE_URL}`;

    if (params.newUser) {
      messageRef = 'share_new_user';
      link = `${link}/reset_password?utm_source=system&utm_medium=email&utm_campaign=share_new_user`;
    }

    const { sender, email } = params;
    const personalisation = { link, email, sender };

    try {
      await this.sendNotifyMessage(messageRef, email, personalisation);
    } catch (err) {
      this.logger.error('Error sending access notification', err);
      return err;
    };
  }
};

module.exports = NotificationsApiClient;
