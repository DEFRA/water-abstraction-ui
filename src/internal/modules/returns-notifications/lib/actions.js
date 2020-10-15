'use strict';

const ACTION_TYPES = {
  setInitialState: 'setInitialState'
};

const setInitialState = (request, data) => ({
  type: ACTION_TYPES.setInitialState,
  payload: data
});

exports.ACTION_TYPES = ACTION_TYPES;
exports.setInitialState = setInitialState;
