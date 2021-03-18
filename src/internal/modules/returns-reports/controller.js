'use strict';

const { isoToReadable } = require('@envage/water-abstraction-helpers').nald.dates;
const services = require('../../lib/connectors/services');
const csv = require('internal/lib/csv-download');

const getStartDate = returnCycle => returnCycle.startDate;

const mapCycle = returnCycle => ({
  ...returnCycle,
  link: `/returns-reports/${returnCycle.id}`
});

/**
 * Gets a list of returns cycles that are active within the service
 */
const getReturnCycles = async (request, h) => {
  // Get data from water service
  const { data } = await services.water.returnCycles.getReport();

  // Sort by date descending
  const [currentCycle, ...cycles] = data
    .sort(getStartDate)
    .reverse()
    .map(mapCycle);

  return h.view('nunjucks/returns-reports/index', {
    ...request.view,
    currentCycle,
    cycles
  });
};

const getConfirmDownload = async (request, h) => {
  const { returnCycleId } = request.params;

  // Get data from water service
  const returnCycle = await services.water.returnCycles.getReturnCycleById(returnCycleId);

  // Format period
  const period = [returnCycle.dateRange.startDate, returnCycle.dateRange.endDate]
    .map(isoToReadable)
    .join(' to ');

  return h.view('nunjucks/returns-reports/confirm-download', {
    ...request.view,
    pageTitle: `Download returns report for ${period}`,
    returnCycle,
    link: `/returns-reports/download/${returnCycle.id}`,
    back: '/returns-reports'
  });
};

const mapReturn = row => ({
  'Return ID': row.id,
  'Licence number': row.licenceRef,
  'Return reference': row.returnRequirement,
  'Frequency': row.returnsFrequency,
  'Start date': row.dateRange.startDate,
  'End date': row.dateRange.startDate,
  'Due date': row.dueDate,
  'Status': row.status,
  'Date received': row.receivedDate,
  'Submitted by': row.user && row.user.email,
  'User type': row.userType
});

const mapFileName = returnCycle => [
  returnCycle.isSummer ? 'Summer' : 'Winter all year',
  `returns ${returnCycle.dateRange.startDate} to ${returnCycle.dateRange.endDate}`,
  '.csv'
].join(' ');

/**
 * Download CSV report to show breakdown of internal/external users
 */
const getDownloadReport = async (request, h) => {
  const { returnCycleId } = request.params;

  // Get return cycle and returns data
  const [ returnCycle, { data } ] = await Promise.all([
    services.water.returnCycles.getReturnCycleById(returnCycleId),
    services.water.returnCycles.getReturnCycleReturns(returnCycleId)
  ]);

  // Map filename and return CSV
  const fileName = mapFileName(returnCycle);
  return csv.csvDownload(h, data.map(mapReturn), fileName);
};

module.exports = {
  getReturnCycles,
  getConfirmDownload,
  getDownloadReport
};
