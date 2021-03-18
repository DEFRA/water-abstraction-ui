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
  const period = [returnCycle.dateRange.startDate, returnCycle.dateRange.startDate]
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

/**
 * Download CSV report to show breakdown of internal/external users
 */
const getDownloadReport = async (request, h) => {
  const { cycleEndDate } = request.params;
  const filter = {
    end_date: cycleEndDate,
    status: 'completed'
  };

  const { error, data } = await services.returns.returns.getReport('userDetails', filter);

  if (error) {
    const err = new Error(`Returns report error`);
    err.params = { error, data, cycleEndDate };
    throw err;
  }

  const filename = `returns-report-${cycleEndDate}.csv`;

  return csv.csvDownload(h, data, filename);
};

module.exports = {
  getReturnCycles,
  getConfirmDownload,
  getDownloadReport
};
