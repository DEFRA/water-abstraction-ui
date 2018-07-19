const reducer = require('./reducer');
const { STATUS_IN_PROGRESS } = require('./statuses');

/**
 * Gets initial state for the specified licence row from the permit repo
 * @param {Object} licence  - row from permit repo data
 * @return {Object} initial state for state manager
 */
const getInitialState = (licence) => {
  return {
    licence: licence.licence_data_value,
    status: STATUS_IN_PROGRESS
  };
};

/**
 * Gets final state based on:
 * @param {String} initialState - the immutable base licence data from permit repo
 * @param {Array} actions - an array of actions describing mutations to the data
 * @param {Function} reducer - a function which accepts the state and an action, and returns the next state
 */
const stateManager = (initialState, actions = []) => {
  let state = initialState;

  for (let action of actions) {
    state = reducer(state, action);
  }

  return state;
};

module.exports = {
  getInitialState,
  stateManager
};
