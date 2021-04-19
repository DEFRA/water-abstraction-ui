'use-strict';

const services = require('internal/lib/connectors/services');
const returnCycleMapper = require('./mappers/return-cycle');

const getKPIDashboard = async (request, h) => {
  const { data } = await services.water.kpiReporting.getKpiData();
  const viewContext = {
    ...request.view,
    ...data,
    returnCycles: data.returnsCycles.map(returnCycleMapper.mapReturnCycle).reverse()
  };
  return h.view('nunjucks/kpi-reporting/dashboard', viewContext);
};

module.exports.getKPIDashboard = getKPIDashboard;
