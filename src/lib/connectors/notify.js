const Water = require('./water');

function sendNewUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.base_url + '/create-password?resetGuid=' + resetGuid + '&utm_source=system&utm_medium=email&utm_campaign=create_password';
  return Water.sendNotifyMessage('new_user_verification_email', emailAddress, { link });
}

function sendExistingUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.base_url + '/signin';
  const resetLink = process.env.base_url + '/reset_password_change_password?resetGuid=' + resetGuid + '&utm_source=system&utm_medium=email&utm_campaign=reset_password';
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

function sendAccesseNotification (params) {
  return new Promise((resolve, reject) => {
    if (params.newUser) {
      var message_ref = 'share_new_user';
      var templateId = '145e2919-da41-4f4d-9570-17f5bb12f119';
      var link = `${process.env.base_url}/reset_password?utm_source=system&utm_medium=email&utm_campaign=share_new_user`;
      var personalisation = {
        link: link,
        email: params.email,
        sender: params.sender
      };
    } else {
      var message_ref = 'share_existing_user';
      var templateId = '725e399e-772b-4c91-835b-68f4995ab6ff';
      var link = `${process.env.base_url}?access=PB01&utm_source=system&utm_medium=email&utm_campaign=share_existing_user`;
      var personalisation = {
        link: link,
        email: params.email,
        sender: params.sender

      };
    }
    var emailAddress = params.email;
    Water.sendNotifyMessage(message_ref, emailAddress, personalisation)
      .then((response) => {
        return resolve(true);
      })
      .catch((err) => {
        return resolve(true);
      });
  });
}

module.exports = {
  sendAccesseNotification: sendAccesseNotification,
  sendNewUserPasswordReset,
  sendExistingUserPasswordReset,
  sendSecurityCode
};
