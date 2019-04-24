const { get, negate, isEmpty } = require('lodash');
const Water = require('./water');
const logger = require('../logger');

const getAddressLinesFromLicence = licence => {
  return [
    get(licence, 'metadata.Name', ''),
    get(licence, 'metadata.AddressLine1', ''),
    get(licence, 'metadata.AddressLine2', ''),
    get(licence, 'metadata.AddressLine3', ''),
    get(licence, 'metadata.AddressLine4', ''),
    get(licence, 'metadata.Town', ''),
    get(licence, 'metadata.County', '')
  ]
    .map(str => str.trim())
    .filter(negate(isEmpty));
};

/**
 * Add FAO details to first line of address. If address lines are full, add FAO to start of first line
 * @param {Array} lines address lines
 * @param {String} fao  name of person to address letter to
 */
const addFaoToAddress = (lines, fao) => {
  if (lines.length >= 6) {
    lines[0] = `${fao}, `.concat(lines[0]);
  } else {
    lines.unshift(fao);
  }
  return lines;
};

/**
 * There are 6 available address slots in the notify templates, plus an extra for postcode.
 *
 * Therefore if there are more than 6, remove the AddressLine4 item which
 * hopefully leaves the most important address components in place.
 */
const ensureMaximumAddressLength = lines => {
  if (lines.length > 6) {
    lines.splice(4, 1);
  }
  return lines;
};

const createAddress = (licence, fao) => {
  const lines = getAddressLinesFromLicence(licence);
  if (fao) addFaoToAddress(lines, fao);
  ensureMaximumAddressLength(lines);

  return lines.reduce((memo, line, i) => {
    memo[`address_line_${i + 1}`] = line;
    return memo;
  }, {
    postcode: get(licence, 'metadata.Postcode', '')
  });
};

function sendNewUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.BASE_URL + '/create-password?resetGuid=' + resetGuid + '&utm_source=system&utm_medium=email&utm_campaign=create_password';
  return Water.sendNotifyMessage('new_user_verification_email', emailAddress, { link });
}

function sendExistingUserPasswordReset (emailAddress, resetGuid) {
  const link = process.env.BASE_URL + '/signin';
  const resetLink = process.env.BASE_URL + '/reset_password_change_password?resetGuid=' + resetGuid;
  return Water.sendNotifyMessage('existing_user_verification_email', emailAddress, { link, resetLink });
}

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
function sendSecurityCode (licence, fao, accesscode) {
  // Get address components from licence
  const address = createAddress(licence, fao);

  // Format personalisation with address lines and postcode
  const personalisation = Object.assign({}, address, {
    accesscode,
    siteaddress: process.env.BASE_URL,
    licenceholder: licence.metadata.Name,
    postcode: licence.metadata.Postcode
  });

  return Water.sendNotifyMessage('security_code_letter', 'n/a', personalisation);
}

function sendAccessNotification (params) {
  return new Promise((resolve, reject) => {
    let messageRef;
    let link = `${process.env.BASE_URL}`;

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
      .then(() => {
        return resolve(true);
      })
      .catch(err => {
        logger.error('Error sending access notification', err);
        return resolve(true);
      });
  });
}

module.exports = {
  sendAccessNotification: sendAccessNotification,
  sendNewUserPasswordReset,
  sendExistingUserPasswordReset,
  sendSecurityCode,
  createAddress
};
