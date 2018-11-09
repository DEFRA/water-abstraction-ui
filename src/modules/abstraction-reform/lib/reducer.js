const update = require('immutability-helper');
const { findIndex, set } = require('lodash');
const { EDIT_PURPOSE, EDIT_LICENCE, EDIT_POINT, EDIT_CONDITION, SET_STATUS, EDIT_VERSION, EDIT_PARTY, EDIT_ADDRESS } = require('./action-types');
const { STATUS_IN_PROGRESS } = require('./statuses');
const { setObject, isMatch, isVersion } = require('./helpers');

/**
 * Gets a base update query with the user who edited and timestamp
 * included.
 * @param {Object} action
 * @return {Object} query for immutability helper
 */
const getBaseQuery = (action, status = STATUS_IN_PROGRESS) => {
  const { user, timestamp } = action.payload;
  return {
    status: {
      $set: status
    },
    lastEdit: {
      $set: {
        user,
        timestamp
      }
    }
  };
};

/**
 * Edits a licence purpose within the current_version by ID
 */
const editPurpose = (state, action) => {
  const { purposeId, data } = action.payload;

  const index = findIndex(state.licence.data.current_version.purposes, (row) => {
    return parseInt(row.ID) === parseInt(purposeId);
  });

  if (index === -1) {
    throw new Error(`Purpose ${purposeId} not found`);
  }

  const query = {
    ...getBaseQuery(action),
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
};

/**
 * Edits base level licence data
 */
const editLicence = (state, action) => {
  const { data } = action.payload;
  let query = {
    ...getBaseQuery(action),
    licence: {
      $merge: data
    }
  };
  return update(state, query);
};

/**
 * Edits a point within current licence data
 */
const editPoint = (state, action) => {
  const { pointId, data } = action.payload;

  const query = {
    ...getBaseQuery(action),
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
};

const editCondition = (state, action) => {
  const { conditionId, data } = action.payload;

  const query = {
    ...getBaseQuery(action),
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
};

/**
 * Edits a licence version
 * @param {Object} state - current state
 * @param {Object} action - action data
 * @param {Object} action.payload.data - modified data
 * @param {Number} action.payload.issueNumber - licence issue number
 * @param {Number} action.payload.incrementNumber - licence increment number
 */
const editVersion = (state, action) => {
  const { data, issueNumber, incrementNumber } = action.payload;

  const query = {
    ...getBaseQuery(action)
  };

  // Check current licence version
  if (isVersion(state.licence.data.current_version.licence, issueNumber, incrementNumber)) {
    set(query, 'licence.data.current_version.licence.$merge', data);
  }

  // Check versions array
  state.licence.data.versions.forEach((version, i) => {
    if (isVersion(version, issueNumber, incrementNumber)) {
      setObject(query, `licence.data.versions.${i}.$merge`, data);
    }
  });

  return update(state, query);
};

/**
 * Edits party
 * @param {Object} state - current state
 * @param {Object} action - action data
 */
const editParty = (state, action) => {
  const { data, partyId } = action.payload;

  const query = {
    ...getBaseQuery(action)
  };

  // Check current licence version
  if (isMatch(state.licence.data.current_version.party, partyId)) {
    set(query, 'licence.data.current_version.party.$merge', data);
  }

  // Check other parties nested in versions
  state.licence.data.versions.forEach((version, i) => {
    version.parties.forEach((party, j) => {
      if (isMatch(party, partyId)) {
        setObject(query, `licence.data.versions.${i}.parties.${j}.$merge`, data);
      }
    });
  });

  // Check licence party
  state.licence.data.current_version.licence.party.forEach((party, i) => {
    if (isMatch(party, partyId)) {
      setObject(query, `licence.data.current_version.licence.party.${i}.$merge`, data);
    }
  });

  return update(state, query);
};

/**
 * Edits address
 * @param {Object} state - current state
 * @param {Object} action - action data
 */
const editAddress = (state, action) => {
  const { data, addressId } = action.payload;

  const query = {
    ...getBaseQuery(action)
  };

  // Check current licence version
  if (isMatch(state.licence.data.current_version.address, addressId)) {
    set(query, 'licence.data.current_version.address.$merge', data);
  }

  // Check other parties nested in versions
  state.licence.data.versions.forEach((version, i) => {
    version.parties.forEach((party, j) => {
      party.contacts.forEach((contact, k) => {
        const { party_address: address } = contact;
        if (isMatch(address, addressId)) {
          setObject(query, `licence.data.versions.${i}.parties.${j}.contacts.${k}.party_address.$merge`, data);
        }
      });
    });
  });

  return update(state, query);
};

/**
 * Updates document workflow state
 */
const setState = (state, action) => {
  const { status, notes, user, timestamp } = action.payload;

  const query = getBaseQuery(action, status);

  if (notes) {
    query.notes = {
      $push: [{
        notes,
        user,
        timestamp
      }]
    };
  }

  return update(state, query);
};

const reducer = (state, action) => {
  switch (action.type) {
    case EDIT_PURPOSE:
      return editPurpose(state, action);

    case EDIT_LICENCE:
      return editLicence(state, action);

    case EDIT_POINT:
      return editPoint(state, action);

    case EDIT_CONDITION:
      return editCondition(state, action);

    case SET_STATUS:
      return setState(state, action);

    case EDIT_VERSION:
      return editVersion(state, action);

    case EDIT_PARTY:
      return editParty(state, action);

    case EDIT_ADDRESS:
      return editAddress(state, action);

    default:
      return state;
  }
};

module.exports = reducer;
