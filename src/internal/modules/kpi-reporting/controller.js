'use-strict';

const { sortBy } = require('lodash');
const services = require('internal/lib/connectors/services');
const returnCycleMapper = require('./mappers/return-cycle');

const getKPIDashboard = async (request, h) => {
  const { data } = await services.water.kpiReporting.getKpiData();

  const returnCycles = sortBy(data.returnCycles, cycle => cycle.startDate)
    .reverse()
    .map(returnCycleMapper.mapReturnCycle);

  const viewContext = {
    ...request.view,
    ...data,
    returnCycles
  };
  return h.view('nunjucks/kpi-reporting/dashboard', viewContext);
};

module.exports.getKPIDashboard = getKPIDashboard;
