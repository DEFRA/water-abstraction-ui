/**
 * A module to get/set user_data in user record of IDM
 */

const { usersClient } = require('./connectors/idm.js');

/**
 * Gets user data from API as object
 * @param {Number} userId
 * @return {Object} user data
 */
const getUserData = async (userId) => {
  const {data: user, error} = await usersClient.findOne(userId);
  if (error) {
    throw new Error(error);
  }
  return user.user_data;
};

/**
 * Sets user data
 * @param {Number} userId
 * @param {Object} data - new value for user_data object
 */
const setUserData = async (userId, data) => {
  return usersClient.updateOne(userId, {user_data: data});
};

module.exports = {
  getUserData,
  setUserData
};
