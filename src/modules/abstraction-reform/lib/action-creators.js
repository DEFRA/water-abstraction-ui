const { EDIT_PURPOSE } = require('./action-types');

const formatUser = (user) => {
  const {user_id: id, username: email} = user;
  return {id, email};
};

const createEditPurpose = (purposeId, data, user) => {
  return {
    type: EDIT_PURPOSE,
    payload: {
      purposeId,
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

module.exports = {
  createEditPurpose
};
