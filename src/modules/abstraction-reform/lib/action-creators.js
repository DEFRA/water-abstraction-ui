const { EDIT_PURPOSE, EDIT_LICENCE } = require('./action-types');

const formatUser = (user) => {
  const {user_id: id, username: email} = user;
  return {id, email};
};

const createEditPurpose = (data, user, id) => {
  return {
    type: EDIT_PURPOSE,
    payload: {
      purposeId: id,
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

const createEditLicence = (data, user) => {
  return {
    type: EDIT_LICENCE,
    payload: {
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

module.exports = {
  createEditPurpose,
  createEditLicence
};
