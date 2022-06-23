/**
 * A module to get/set user_data in user record of IDM
 */

const services = require('./connectors/services')
/**
 * Sets user data
 * @param {Number} userId
 * @param {Object} data - new value for user_data object
 */
const setUserData = async (userId, data) => {
  return services.idm.users.updateOne(userId, { user_data: data })
}

exports.setUserData = setUserData
