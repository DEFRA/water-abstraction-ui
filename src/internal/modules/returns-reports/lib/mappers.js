'use strict';
const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;

const mapCycle = returnCycle => ({
  ...returnCycle,
  link: `/returns-reports/${returnCycle.id}`
});

const mapReturn = row => ({
  'Return ID': row.id,
  'Licence number': row.licenceRef,
  'Return reference': row.returnRequirement,
  Frequency: row.returnsFrequency,
  'Start date': row.dateRange.startDate,
  'End date': row.dateRange.startDate,
  'Due date': row.dueDate,
  Status: row.status,
  'Date received': row.receivedDate,
  'Submitted by': row.user && row.user.email,
  'User type': row.userType
});

const mapFileName = returnCycle => [
  isoToReadable(returnCycle.dateRange.startDate),
  'to',
  isoToReadable(returnCycle.dateRange.endDate),
  returnCycle.isSummer ? 'summer' : 'winter/all year',
  'returns.csv'
].join(' ');

exports.mapCycle = mapCycle;
exports.mapReturn = mapReturn;
exports.mapFileName = mapFileName;
