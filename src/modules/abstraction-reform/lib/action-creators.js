const uuidv4 = require('uuid/v4');
const statuses = require('./statuses');
const {
  EDIT_PURPOSE, EDIT_LICENCE, EDIT_POINT, EDIT_CONDITION, SET_STATUS,
  EDIT_VERSION, EDIT_PARTY, EDIT_ADDRESS,
  ADD_DATA, EDIT_DATA, DELETE_DATA
} = require('./action-types');

const formatUser = (user) => {
  const {user_id: id, username: email} = user;
  return {id, email};
};

/**
 * Edits the purpose of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the purpose ID
 * @return {Object} action to edit purpose
 */
const createEditPurpose = (data, user, id) => {
  return {
    type: EDIT_PURPOSE,
    payload: {
      purposeId: parseInt(id),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the base licence data
 * @param {Object} data - key/value pairs of data to edit
 * @param {Object} user - the current user of the application
 * @return {Object} action to edit licence base data
 */
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

/**
 * Edits the point of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the point ID
 * @return {Object} action to edit point
 */
const createEditPoint = (data, user, id) => {
  return {
    type: EDIT_POINT,
    payload: {
      pointId: parseInt(id),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the condition of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the condition ID
 * @return {Object} action to edit condition
 */
const createEditCondition = (data, user, id) => {
  return {
    type: EDIT_CONDITION,
    payload: {
      conditionId: parseInt(id),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the condition of a licence
 * @param {String} status - the new status
 * @param {String} notes - notes to record with the status change
 * @param {Object} user - the current user of the application
 * @return {Object} action to edit condition
 */
const createSetStatus = (status, notes, user) => {
  if (!Object.values(statuses).includes(status)) {
    throw new Error(`Invalid AR status ${status}`);
  }

  return {
    type: SET_STATUS,
    payload: {
      status,
      notes: notes.trim() || null,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence version
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the condition ID
 * @return {Object} action to edit condition
 */
const createEditVersion = (data, user, issueNumber, incrementNumber) => {
  return {
    type: EDIT_VERSION,
    payload: {
      issueNumber: parseInt(issueNumber),
      incrementNumber: parseInt(incrementNumber),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence party
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the party ID
 * @return {Object} action to edit condition
 */
const createEditParty = (data, user, id) => {
  return {
    type: EDIT_PARTY,
    payload: {
      partyId: parseInt(id),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence address
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} user - the current user of the application
 * @param {Number} id - the address ID
 * @return {Object} action to edit condition
 */
const createEditAddress = (data, user, id) => {
  return {
    type: EDIT_ADDRESS,
    payload: {
      addressId: parseInt(id),
      data,
      user: formatUser(user),
      timestamp: Date.now()
    }
  };
};

/**
 * Creates a new data object - e.g. for WR22 data
 * @param {String} id - GUID of new data point
 * @param {String} schema - to use for the new data point, e.g. wr22/2.1
 * @param
 */
const createAddData = (schema, user, issueNumber, incrementNumber) => {
  return {
    type: ADD_DATA,
    payload: {
      id: uuidv4(),
      schema,
      user: formatUser(user),
      timestamp: Date.now(),
      issueNumber: parseInt(issueNumber),
      incrementNumber: parseInt(incrementNumber)
    }
  };
};

module.exports = {
  createEditPurpose,
  createEditLicence,
  createEditPoint,
  createEditCondition,
  createSetStatus,
  createEditVersion,
  createEditAddress,
  createEditParty,
  createAddData
};
