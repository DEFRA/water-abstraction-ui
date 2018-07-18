const update = require('immutability-helper');
const { EDIT_PURPOSE } = require('./action-types');
const { findIndex } = require('lodash');

const reducer = (state, action) => {
  switch (action.type) {
    case EDIT_PURPOSE:

      const { purposeId, data } = action.payload;

      const index = findIndex(state.licence.data.current_version.purposes, (row) => {
        return row.ID == purposeId;
      });

      if (index === -1) {
        throw new Error(`Purpose ${purposeId} not found`);
      }

      const query = {
        licence: {
          data: {
            current_version: {
              purposes: {
                [index]: {
                  $merge: data
                }
              }
            }
          }
        }
      };

      return update(state, query);

    default:
      return state;
  }
};

module.exports = reducer;
