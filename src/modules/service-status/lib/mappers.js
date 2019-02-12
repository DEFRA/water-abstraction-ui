const { isObject } = require('lodash');

// Checks whether value is 'ERROR'
const isError = value => value === 'ERROR';

/**
 * Counts occurences of 'ERROR' in array
 * @param  {[type]} arr [description]
 * @return {[type]}     [description]
 */
const countErrors = (arr) => {
  return arr.filter(isError).length;
};

/**
 * Maps status data to view
 * @param  {Array} data - data retrieved from each API call, or 'ERROR'
 * @return {Object}       view data
 */
const mapToView = (data) => {
  const [
    userCount,
    idmKPI,
    crmDocumentCount,
    crmKPI,
    crmVerificationCount,
    permitCount,
    waterPendingImports,
    waterCompletedImports,
    virusScanner
  ] = data;

  return {
    userCount,
    idmKPI,
    crmDocumentCount,
    crmKPI,
    crmVerificationCount,
    permitCount,
    waterPendingImports,
    waterCompletedImports,
    errorCount: countErrors(data),
    virusScanner
  };
};

/**
 * Maps CRM KPIs to obejct
 * @param  {Array} data - rows of CRM KPI data
 * @return {Object}      mapped to key/value pairs
 */
const mapCRMKPI = (data) => {
  if (!isObject(data)) {
    return {};
  }
  return data.reduce((acc, row) => {
    acc[row.datapoint] = row.value;
    return acc;
  }, {});
};

/**
 * Maps IDM KPIs to obejct
 * @param  {Array} data - rows of IDM KPI data
 * @return {Object}      mapped to key/value pairs
 */
const mapIDMKPI = (data) => {
  if (!isObject(data)) {
    return {};
  }
  return data.reduce((acc, row) => {
    acc[row.datapoint] = row.measure;
    return acc;
  }, {});
};

/**
 * Maps status data to object for JSON representation
 * @param  {Array} data - data retrieved from each API call, or 'ERROR'
 * @return {Object}       JSON data
 */
const mapToJSON = (data) => {
  const [
    userCount,
    idmKPI,
    crmDocumentCount,
    crmKPI,
    crmVerificationCount,
    permitCount,
    waterPendingImports,
    waterCompletedImports,
    virusScanner
  ] = data;

  return {
    idm: {
      users: userCount,
      ...mapIDMKPI(idmKPI)
    },
    crm: {
      documents: crmDocumentCount,
      ...mapCRMKPI(crmKPI),
      verifications: crmVerificationCount
    },
    waterservice: {
      import: {
        pending: waterPendingImports,
        complete: waterCompletedImports
      }
    },
    permitrepo: {
      permits: permitCount
    },
    virusScanner
  };
};

module.exports = {
  countErrors,
  mapCRMKPI,
  mapIDMKPI,
  mapToView,
  mapToJSON
};
