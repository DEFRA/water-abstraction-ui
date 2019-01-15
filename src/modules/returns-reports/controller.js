const helpers = require('@envage/water-abstraction-helpers');
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
    cycles: rest
  }, { layout: false });
};

module.exports = {
  getReturns
};
