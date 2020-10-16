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

const mapDocumentRow = ({ returns, document }, refDate) => ({
  returns: returns.map(ret => mapReturn(ret, refDate)),
  document: mapDocument(document)
});

const mapLicenceRow = ({ licence, documents }, refDate) => ({
  licence,
  documents: documents.map(documentRow => ({
    ...mapDocumentRow(documentRow, refDate),
    isSelected: documents.length === 1
  }))
});

const mapLicencesToState = (licences, refDate) =>
  licences.map(licence => mapLicenceRow(licence, refDate));

const reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.setInitialState:
      const { licences, refDate } = action.payload;
      return mapLicencesToState(licences, refDate);

    default:
      return state;
  }
};

exports.reducer = reducer;
