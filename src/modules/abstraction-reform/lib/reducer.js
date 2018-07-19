const update = require('immutability-helper');
const { EDIT_PURPOSE, EDIT_LICENCE, EDIT_POINT, EDIT_CONDITION } = require('./action-types');
const { STATUS_IN_PROGRESS, STATUS_IN_REVIEW } = require('./statuses');
const { findIndex } = require('lodash');

const reducer = (state, action) => {
  switch (action.type) {
    case EDIT_PURPOSE:
    {
      const { purposeId, data, user, timestamp } = action.payload;

      const index = findIndex(state.licence.data.current_version.purposes, (row) => {
        return parseInt(row.ID) === parseInt(purposeId);
      });

      if (index === -1) {
        throw new Error(`Purpose ${purposeId} not found`);
      }

      const query = {
        status: {
          $set: STATUS_IN_PROGRESS
        },
        lastEdit: {
          $set: {
            user,
            timestamp
          }
        },
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
    }

    case EDIT_LICENCE:
    {
      const { data, user, timestamp } = action.payload;
      let query = {
        status: {
          $set: STATUS_IN_PROGRESS
        },
        lastEdit: {
          $set: {
            user,
            timestamp
          }
        },
        licence: {
          $merge: data
        }
      };
      return update(state, query);
    }

    case EDIT_POINT:
    {
      const { pointId, data, user, timestamp } = action.payload;

      const query = {
        status: {
          $set: STATUS_IN_PROGRESS
        },
        lastEdit: {
          $set: {
            user,
            timestamp
          }
        },
        licence: {
          data: {
            current_version: {
              purposes: {
              }
            }
          }
        }
      };

      state.licence.data.current_version.purposes.forEach((purpose, i) => {
        purpose.purposePoints.forEach((point, j) => {
          if (parseInt(point.point_detail.ID) === parseInt(pointId)) {
            query.licence.data.current_version.purposes[i] = {
              purposePoints: {
                [j]: {
                  point_detail: {
                    $merge: data
                  }
                }
              }
            };
          }
        });
      });

      return update(state, query);
    }

    case EDIT_CONDITION:
    {
      const { conditionId, data, user, timestamp } = action.payload;

      const query = {
        status: {
          $set: STATUS_IN_PROGRESS
        },
        lastEdit: {
          $set: {
            user,
            timestamp
          }
        },
        licence: {
          data: {
            current_version: {
              purposes: {
              }
            }
          }
        }
      };

      state.licence.data.current_version.purposes.forEach((purpose, i) => {
        purpose.licenceConditions.forEach((condition, j) => {
          if (parseInt(condition.ID) === parseInt(conditionId)) {
            query.licence.data.current_version.purposes[i] = {
              licenceConditions: {
                [j]: {
                  $merge: data
                }
              }
            };
          }
        });
      });

      return update(state, query);
    }

    default:
      return state;
  }
};

module.exports = reducer;
