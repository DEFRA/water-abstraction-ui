const uuidv4 = require('uuid/v4');
const statuses = require('./statuses');
const {
  EDIT_PURPOSE, EDIT_LICENCE, EDIT_POINT, EDIT_CONDITION, SET_STATUS,
  EDIT_VERSION, EDIT_PARTY, EDIT_ADDRESS,
  ADD_DATA, EDIT_DATA, DELETE_DATA
} = require('./action-types');

const formatUser = (defra) => {
  const { userId: id, userName: email } = defra;
  return { id, email };
};

/**
 * Edits the purpose of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the purpose ID
 * @return {Object} action to edit purpose
 */
const createEditPurpose = (data, defra, id) => {
  return {
    type: EDIT_PURPOSE,
    payload: {
      purposeId: parseInt(id),
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the base licence data
 * @param {Object} data - key/value pairs of data to edit
 * @param {Object} defra - the current user of the application
 * @return {Object} action to edit licence base data
 */
const createEditLicence = (data, defra) => {
  return {
    type: EDIT_LICENCE,
    payload: {
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the point of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the point ID
 * @return {Object} action to edit point
 */
const createEditPoint = (data, defra, id) => {
  return {
    type: EDIT_POINT,
    payload: {
      pointId: parseInt(id),
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits the condition of a licence
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the condition ID
 * @return {Object} action to edit condition
 */
const createEditCondition = (data, defra, id) => {
  return {
    type: EDIT_CONDITION,
    payload: {
      conditionId: parseInt(id),
      data,
      user: formatUser(defra),
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
const createSetStatus = (status, notes, defra) => {
  if (!Object.values(statuses).includes(status)) {
    throw new Error(`Invalid AR status ${status}`);
  }

  return {
    type: SET_STATUS,
    payload: {
      status,
      notes: notes.trim() || null,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence version
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the condition ID
 * @return {Object} action to edit condition
 */
const createEditVersion = (data, defra, issueNumber, incrementNumber) => {
  return {
    type: EDIT_VERSION,
    payload: {
      issueNumber: parseInt(issueNumber),
      incrementNumber: parseInt(incrementNumber),
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence party
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the party ID
 * @return {Object} action to edit condition
 */
const createEditParty = (data, defra, id) => {
  return {
    type: EDIT_PARTY,
    payload: {
      partyId: parseInt(id),
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Edits a licence address
 * @param {Object} data - key/value pairs of purpose data to edit
 * @param {Object} defra - the current user of the application
 * @param {Number} id - the address ID
 * @return {Object} action to edit condition
 */
const createEditAddress = (data, defra, id) => {
  return {
    type: EDIT_ADDRESS,
    payload: {
      addressId: parseInt(id),
      data,
      user: formatUser(defra),
      timestamp: Date.now()
    }
  };
};

/**
 * Creates a new data object - e.g. for WR22 data
 * @param {String} schema - the name of the schema that describes this data point
 * @param {Object} user - the current user of the application
 * @param {String|Number} issueNumber - the NALD licence issue number
 * @param {String|Number} incrementNumber schema - the NALD licence increment number
 * @param
 */
const createAddData = (schema, defra, issueNumber, incrementNumber) => {
  return {
    type: ADD_DATA,
    payload: {
      id: uuidv4(),
      schema,
      user: formatUser(defra),
      timestamp: Date.now(),
      issueNumber: parseInt(issueNumber),
      incrementNumber: parseInt(incrementNumber)
    }
  };
};

/**
 * Edits a data object in the AR data items list
 * @param {Object} data - object of data to store
 * @param {Object} user - the current application user
 * @param {String} id - GUID of data point
 * @param
 */
const createEditData = (data, defra, id) => {
  return {
    type: EDIT_DATA,
    payload: {
      id,
      user: formatUser(defra),
      data,
      timestamp: Date.now()
    }
  };
};

/**
 * Deletes a data object in the AR data items list
 * @param {Object} user - the current application user
 * @param {String} id - GUID of data point to delete
 * @param
 */
const createDeleteData = (defra, id) => {
  return {
    type: DELETE_DATA,
    payload: {
      id,
      user: formatUser(defra),
      timestamp: Date.now()
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
  createAddData,
  createEditData,
  createDeleteData
};
