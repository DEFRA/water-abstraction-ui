const csv = require('util').promisify(require('csv-stringify'));
const helpers = require('@envage/water-abstraction-helpers');

const { returns } = require('../../lib/connectors/returns');
const { getReturnStats } = require('./lib/returns-stats');

const getCycleStats = async cycle => {
  cycle.stats = await getReturnStats(cycle.endDate);
  return cycle;
};

/**
 * Gets a list of returns cycles that are active within the service
 */
const getReturns = async (request, h) => {
  const cycles = helpers.returns.date.createReturnCycles();
  const cyclesWithStats = await Promise.all(cycles.map(getCycleStats));

  const [currentCycle, ...rest] = cyclesWithStats.reverse();

  return h.view('nunjucks/returns-reports/index.njk', {
    ...request.view,
    currentCycle,
    cycles: rest,
    csvPath: `/returns-reports/download/${currentCycle.endDate}`
  }, { layout: false });
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

  const { error, data } = await returns.getReport('userDetails', filter);

  if (error) {
    const err = new Error(`Returns report error`);
    err.params = { error, data, cycleEndDate };
    throw err;
  }

  const str = await csv(data, { header: true });

  const filename = `returns-report-${cycleEndDate}.csv`;

  return h.response(str)
    .header('content-type', 'text/csv')
    .header('content-disposition', `attachment; filename=${filename}`);
};

module.exports = {
  getReturns,
  getDownloadReport
};
