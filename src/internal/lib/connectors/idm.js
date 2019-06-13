const uuid = require('uuid/v4');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const { APIClient } = require('@envage/hapi-pg-rest-api');

const usersClient = new APIClient(rp, {
  endpoint: `${process.env.IDM_URI}/user`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
});

const config = require('../../config');
const idmKPI = require('./idm/kpi');

/**
 * Reset user's password in IDM
 * Triggers notify message
 * @param {String} email - user's email address
 * @param {String} mode - can be reset|new|existing
 * @param {Object} [params] - additional optional query string params
 * @return {Promise} resolves with {error, data}, data contains user_id and reset_guid
 */
function resetPassword (email, mode = 'reset', params = {}) {
  const { application } = config.idm;
  return rp({
    uri: `${process.env.IDM_URI}/reset/${application}/${email}`,
    qs: {
      mode,
      ...params
    },
    method: 'PATCH',
    json: true,
    headers: {
      Authorization: process.env.JWT_TOKEN
    }
  });
}

/**
 * Check reset guid
 * @param {String} resetGuid - the password reset GUID issued by email
 * @return {Promise} resolves with user record if found or null otherwise
 */
async function getUserByResetGuid (resetGuid) {
  const {
    error,
    data
  } = await usersClient.findMany({
    reset_guid: resetGuid
  });
  if (error) {
    throw error;
  }
  return data.length === 1 ? data[0] : null;
}

/**
 * Create user account in registration process
 * No password is supplied so a random GUID is used as a
 * temporary password, and the user is flagged for password reset
 * @param {String} emailAddress - the user email address
 * @return {Promise} - resolves if user account created
 */
function createUserWithoutPassword (emailAddress) {
  return usersClient.create({
    user_name: emailAddress.toLowerCase(),
    password: uuid(),
    reset_guid: uuid(),
    user_data: {},
    reset_required: 1,
    application: config.idm.application,
    role: {
      scopes: ['external']
    }
  });
}

/**
 * Get user by numeric ID
 * @param {Number} numeric ID
 * @return {Promise} resolves with user if found
 */
const getUser = userId => usersClient.findOne(userId);

/**
 * Gets the user for the current VML application who has the
 * given email address.
 *
 * @param {String} The user's email address.
 * @return {Promise} Resolves with an array of users which should
 * only ever have zero or one users.
 */
function getUserByEmail (email) {
  return usersClient.findMany({
    user_name: email.toLowerCase().trim(),
    application: config.idm.application
  });
}

/**
 * Updates user password
 * @param {number} user id - user's ID
 * @param {String} password - new password
 */
function updatePassword (userId, password) {
  return usersClient.updateOne(userId, { password });
}

/**
 * Update password in IDM
 * @param {String} resetGuid - the reset GUID issues during reset password
 * @param {String} password - new password
 * @return {Promise} resolves when user updated
 */
function updatePasswordWithGuid (resetGuid, password) {
  return usersClient.updateMany({
    reset_guid: resetGuid
  }, {
    password,
    reset_required: 0,
    bad_logins: 0,
    reset_guid: null
  });
}

/**
 * Update the external_id field for the given user
 * @param {object} user - The user
 * @param {String} externalId - The crm entity id
 */
const updateExternalId = (user, externalId) => {
  if (user.external_id) {
    return Promise.resolve();
  }
  return usersClient.updateOne(user.user_id, { external_id: externalId });
};

module.exports = {
  resetPassword,
  updatePassword,
  updatePasswordWithGuid,
  createUserWithoutPassword,
  getUser,
  getUserByEmail,
  getUserByResetGuid,
  usersClient,
  kpi: idmKPI,
  updateExternalId
};
