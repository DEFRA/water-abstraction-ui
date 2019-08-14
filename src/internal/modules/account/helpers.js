const { throwIfError } = require('@envage/hapi-pg-rest-api');
const internalConfig = require('internal/config');
const services = require('internal/lib/connectors/services');

const getEmailRegex = (config = internalConfig) => {
  return (config.isLocal || config.testMode)
    ? /(\.gov\.uk|gmail\.com)$/
    : /\.gov\.uk$/;
};

const getUserById = async (userId) => {
  const { data: user, error } = await services.idm.users.findOne(userId);
  throwIfError(error);
  return user;
};

const getUserByEmail = async (email, config = internalConfig) => {
  const userData = await services.idm.users.findOneByEmail(email, config.idm.application);
  if (userData) {
    const { data: user, error } = userData;
    throwIfError(error);
    return user;
  }
};

const getInternalUser = async (callingUserId, newUserEmail, permission) => {
  return services.water.users.postCreateInternalUser(callingUserId, newUserEmail, permission);
};

exports.getEmailRegex = getEmailRegex;
exports.getUserById = getUserById;
exports.getUserByEmail = getUserByEmail;
exports.getInternalUser = getInternalUser;
