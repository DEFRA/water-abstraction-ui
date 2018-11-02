const Water = require('./water');
const logger = require('../logger');

function sendNewUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.base_url + '/create-password?resetGuid=' + resetGuid + '&utm_source=system&utm_medium=email&utm_campaign=create_password';
  return Water.sendNotifyMessage('new_user_verification_email', emailAddress, { link });
}

function sendExistingUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.base_url + '/signin';
  const resetLink = process.env.base_url + '/reset_password_change_password?resetGuid=' + resetGuid;
  return Water.sendNotifyMessage('existing_user_verification_email', emailAddress, { link, resetLink });
}

/**
 * Sends a letter contaning a security code to the user.
 * In environments other than production, this is skipped and the
 * the function always resolves.
 *
 * @param {Object} licence - licence document header data from CRM
 * @param {String} accesscode - code user receives in post to verify access
 * @return {Promise} resolves with object if successful
 */
function sendSecurityCode (licence, accesscode) {
  // Get address components from licence
  const {
    AddressLine1,
    AddressLine2,
    AddressLine3,
    AddressLine4,
    Town,
    County,
    Postcode: postcode,
    Name: licenceholder
  } = licence.metadata;

  // Filter out non-null lines
  const lines = [AddressLine1, AddressLine2, AddressLine3, AddressLine4, Town, County].filter(str => str.trim());

  // Format personalisation with address lines and postcode
  const personalisation = lines.reduce((memo, line, i) => {
    memo[`address_line_${i + 1}`] = line;
    return memo;
  }, {
    accesscode,
    siteaddress: process.env.base_url,
    licenceholder,
    postcode
  });

  return Water.sendNotifyMessage('security_code_letter', 'n/a', personalisation);
}

function sendAccessNotification (params) {
  return new Promise((resolve, reject) => {
    let messageRef;
    let link = `${process.env.base_url}`;

    if (params.newUser) {
      messageRef = 'share_new_user';
      link = `${link}/reset_password?utm_source=system&utm_medium=email&utm_campaign=share_new_user`;
    } else {
      messageRef = 'share_existing_user';
    }

    const email = params.email;
    const personalisation = {
      link,
      email,
      sender: params.sender
    };

    Water.sendNotifyMessage(messageRef, email, personalisation)
      .then((response) => {
        return resolve(true);
      })
      .catch((err) => {
        logger.error(['error'], err);
        return resolve(true);
      });
  });
}

module.exports = {
  sendAccessNotification: sendAccessNotification,
  sendNewUserPasswordReset,
  sendExistingUserPasswordReset,
  sendSecurityCode
};
