'use-strict';

const services = require('../../lib/connectors/services');

const getKPIDashboard = async (request, h) => {
  const { data } = await services.water.kpiReporting.getKpiData();
  const viewContext = {
    ...request.view,
    ...data
  };
  return h.view('nunjucks/kpi-reporting/dashboard', viewContext);
};

module.exports.getKPIDashboard = getKPIDashboard;
