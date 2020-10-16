'use strict';

const { last } = require('lodash');
const momentRange = require('moment-range');
const moment = momentRange.extendMoment(require('moment'));

const helpers = require('@envage/water-abstraction-helpers');

const { returnStatuses } = require('shared/lib/constants');
const { ACTION_TYPES } = require('./actions');

const isReturnsRole = role => role.roleName === 'returnsTo';

const getInitiallySelectedRole = roles =>
  roles.some(isReturnsRole) ? 'returnsTo' : 'licenceHolder';

const mapDocument = ({ roles, ...rest }) => {
  return {
    roles: [
      ...roles,
      {
        roleName: 'customAddress',
        company: null,
        contact: null,
        address: null
      }
    ],
    selectedRole: getInitiallySelectedRole(roles),
    ...rest
  };
};

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
  const currentCycle = last(helpers.returns.date.createReturnCycles(refDate));
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
const isReturnSelected = ret =>
  (ret.status === returnStatuses.due) && isReturnInCurrentCycle(ret);

const mapReturn = ret => ({
  ...ret,
  isSelected: isReturnSelected(ret)
});

const mapDocumentRow = ({ returns, document }) => ({
  returns: returns.map(mapReturn),
  document: mapDocument(document)
});

const mapLicenceRow = ({ licence, documents }) => ({
  licence,
  documents: documents.map(documentRow => ({
    ...mapDocumentRow(documentRow),
    isSelected: documents.length === 1
  }))
});

const mapLicencesToState = arr => arr.map(mapLicenceRow);

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.setInitialState:
      return mapLicencesToState(action.payload);

    default:
      return state;
  }
};

exports.reducer = reducer;
