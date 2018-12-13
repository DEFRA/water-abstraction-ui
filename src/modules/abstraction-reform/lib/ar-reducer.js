const update = require('immutability-helper');
const { findIndex } = require('lodash');

/**
 * Gets the query for the immutability helper to add a new data item
 * to the arData element of the licence data
 * @param  {Object} state - current state
 * @param  {Object} item  - data item to add
 * @return {Object}       query object for immutability helper
 */
const getAddDataQuery = (state, item) => {
  const hasARData = 'arData' in state.licence;
  if (hasARData) {
    return {
      licence: {
        arData: {
          $push: [item]
        }
      }
    };
  } else {
    return {
      licence: {
        arData: {
          $set: [item]
        }
      }
    };
  }
};

/**
 * Adds new AR data to the licence
 * @param {Object} state  - current state of licence
 * @param {Object} action - action data
 * @return {Object} state - next state of licence
 */
const addData = (state, action) => {
  const { id, schema, issueNumber, incrementNumber } = action.payload;

  const item = {
    id,
    schema,
    issueNumber,
    incrementNumber,
    content: {}
  };

  const ids = (state.licence.arData || []).map(item => item.id);
  if (ids.includes(id)) {
    throw new Error(`Cannot add data with ID ${id}, already exists`);
  }

  // Get query object for immutability-helper update to state
  const query = getAddDataQuery(state, item);

  return update(state, query);
};

/**
 * Edits AR data
 * @param {Object} state  - current state of licence
 * @param {Object} action - action data
 * @return {Object} state - next state of licence
 */
const editData = (state, action) => {
  const { id, data } = action.payload;
  const index = findIndex(state.licence.arData, item => item.id === id);
  if (index === -1) {
    throw new Error(`Cannot edit data with ID ${id}, not found`);
  }
  const query = {
    licence: {
      arData: {
        [index]: {
          content: {
            $merge: data
          }
        }
      }
    }
  };
  return update(state, query);
};

module.exports = {
  addData,
  editData
};
