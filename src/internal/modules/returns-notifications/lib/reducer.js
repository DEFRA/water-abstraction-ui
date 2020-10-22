'use strict';

const update = require('immutability-helper');
const { last, findIndex } = require('lodash');
const momentRange = require('moment-range');
const moment = momentRange.extendMoment(require('moment'));

const helpers = require('@envage/water-abstraction-helpers');

const { crmRoles } = require('shared/lib/constants');
const { returnStatuses } = require('shared/lib/constants');
const { ACTION_TYPES } = require('./actions');

const ONE_TIME_ADDRESS_ROLE = 'oneTimeAddress';

const isReturnsRole = role => role.roleName === 'returnsTo';

const getInitiallySelectedRole = roles =>
  roles.some(isReturnsRole) ? 'returnsTo' : 'licenceHolder';

/**
 * Check if return is in supplied cycle
 * @param {Object} ret - water service return model
 * @param {Object} cycle - { startDate, endDate, isSummer }
 * @return {Boolean}
 */
const isReturnInCycle = (ret, cycle) => {
  const range = moment.range(moment(cycle.startDate), moment(cycle.endDate));
  const isSeasonMatch = ret.isSummer === cycle.isSummer;
  const isDateMatch = range.contains(moment(ret.dateRange.endDate)) && range.contains(moment(ret.dateRange.startDate));
  return isSeasonMatch && isDateMatch;
};

/**
 * Checks if the supplied return is in the current season and cycle
 * @param {Object} ret - water service return model
 * @param {String} [refDate] - a reference date, used for testing
 * @return {Boolean}
 */
const isReturnInCurrentCycle = (ret, refDate) => {
  const currentCycle = last(helpers.returns.date.createReturnCycles('2017-11-01', refDate));
  return isReturnInCycle(ret, currentCycle);
};

/**
 * Checks whether the return should be initially selected.
 * For this to be the case:
 * - The status must be "due"
 * - The return must be in the current cycle
 * @param {Object} ret
 * @return {Boolean}
 */
const isReturnSelected = (ret, refDate) =>
  (ret.status === returnStatuses.due) && isReturnInCurrentCycle(ret, refDate);

const mapReturn = (ret, refDate) => ({
  ...ret,
  isSelected: isReturnSelected(ret, refDate)
});

const mapDocumentRow = ({ licence, documents }, { document, returns }, refDate) => ({
  licence,
  document,
  returns: returns.map(ret => mapReturn(ret, refDate)),
  isSelected: documents.length === 1,
  selectedRole: getInitiallySelectedRole(document.roles)
});

/**
 * Maps to a flat structure of documents for easier manipulation
 * @param {Array<Object>} licences
 * @param {*} refDate
 */
const mapLicencesToState = (licences, refDate) => {
  const map = licences.reduce((acc, licenceRow) => {
    licenceRow.documents.forEach(documentRow =>
      acc.set(documentRow.document.id, mapDocumentRow(licenceRow, documentRow, refDate))
    );
    return acc;
  }, new Map());
  return Object.fromEntries(map);
};

const isValidAddressRole = roleName =>
  [ONE_TIME_ADDRESS_ROLE, crmRoles.licenceHolder, crmRoles.returnsTo].includes(roleName);

const setInitialState = (state, action) => {
  const { licences, refDate } = action.payload;
  return mapLicencesToState(licences, refDate);
};

const setReturnIds = (state, action) => {
  const { documentId, returnIds } = action.payload;
  const query = {
    [documentId]: {
      returns: state[documentId].returns.map(ret => ({
        isSelected: {
          $set: returnIds.includes(ret.id)
        }
      }))
    }
  };

  return update(state, query);
};

const setSelectedRole = (state, action) => {
  const { documentId, selectedRole } = action.payload;
  if (!isValidAddressRole(selectedRole)) {
    return state;
  }
  const query = {
    [documentId]: {
      selectedRole: {
        $set: selectedRole
      }
    }
  };
  return update(state, query);
};

const setOneTimeAddressName = (state, action) => {
  const { documentId, fullName } = action.payload;
  const query = {
    [documentId]: {
      fullName: {
        $set: fullName
      }
    }
  };
  return update(state, query);
};

const setOneTimeAddress = (state, action) => {
  const { documentId, address } = action.payload;

  const index = findIndex(state[documentId].document.roles, role => role.roleName === ONE_TIME_ADDRESS_ROLE);

  const newRole = {
    roleName: ONE_TIME_ADDRESS_ROLE,
    address,
    company: {
      name: state[documentId].fullName
    }
  };

  const roles = index === -1
    ? { $push: [newRole] }
    : { $splice: [[index, 1, newRole]] };

  const query = {
    [documentId]: {
      document: {
        roles
      },
      selectedRole: {
        $set: ONE_TIME_ADDRESS_ROLE
      }
    }
  };

  return update(state, query);
};

const actions = {
  [ACTION_TYPES.setInitialState]: setInitialState,
  [ACTION_TYPES.setReturnIds]: setReturnIds,
  [ACTION_TYPES.setSelectedRole]: setSelectedRole,
  [ACTION_TYPES.setOneTimeAddressName]: setOneTimeAddressName,
  [ACTION_TYPES.setOneTimeAddress]: setOneTimeAddress
};

const reducer = (state, action) => {
  if (action.type in actions) {
    return actions[action.type](state, action);
  }
  return state;
};

exports.reducer = reducer;
