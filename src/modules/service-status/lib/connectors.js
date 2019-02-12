const { throwIfError } = require('@envage/hapi-pg-rest-api');
const IDM = require('../../../lib/connectors/idm');
const CRM = require('../../../lib/connectors/crm');
const permits = require('../../../lib/connectors/permit');
const water = require('../../../lib/connectors/water');

const firstPage = {
  perPage: 1
};

/**
 * Gets total row count by calling findMany on supplied api client
 * @param  {Object}  apiClient - hapi-pg-rest-api API client
 * @return {Promise}           resolves with row count
 */
const getCount = async (apiClient, filter = {}) => {
  const { pagination, error } = await apiClient.findMany(filter, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
};

/**
 * Gets number of users in IDM
 * @return {Promise} Resolves with number of users
 */
const getIDMUserCount = async () => {
  return getCount(IDM.usersClient);
};

const getKPIData = async (apiClient) => {
  const { data, error } = await apiClient.findMany();
  throwIfError(error);
  return data;
};

/**
 * Gets KPIs from IDM service
 * @return {Promise} resolves with array of IDM KPIs
 */
const getIDMKPIData = async () => {
  return getKPIData(IDM.kpi);
};

/**
 * Gets number of documents imported to CRM
 * @return {Promise} resolves with number of CRM docs
 */
const getCRMDocumentCount = async () => {
  return getCount(CRM.documents);
};

/**
 * Gets KPIs from CRM
 * @return {Promise} resolves wtih array of CRM KPIs
 */
const getCRMKPIData = async () => {
  return getKPIData(CRM.kpi);
};

/**
 * Gets number of verifications
 * @return {Promise} resolves with number of CRM verifications
 */
const getCRMVerificationCount = async () => {
  return getCount(CRM.verification);
};

/**
 * Gets number of abstraction licences from permit repo
 * @return {Promise} resolves with number of abstraction licences
 */
const getPermitCount = async () => {
  const filter = {
    licence_regime_id: 1,
    licence_type_id: 8
  };
  return getCount(permits.licences, filter);
};

/**
 * Gets number of pending imports of given status in water service
 * @param {Number} status
 * @return {Promise} resolves with number of pending/completed imports
 */
const getWaterImportStatus = async (status) => {
  const filter = {
    status
  };
  return getCount(water.pendingImport, filter);
};

/**
 * Gets number of pending licence imports in water service
 * @return {Promise} - resolves with number of pending licence imports
 */
const getWaterPendingImports = () => {
  return getWaterImportStatus(0);
};

/**
 * Gets number of completed licence imports in water service
 * @return {Promise} - resolves with number of completed licence imports
 */
const getWaterCompletedImports = () => {
  return getWaterImportStatus(1);
};

module.exports = {
  getCount,
  getIDMUserCount,
  getKPIData,
  getIDMKPIData,
  getCRMDocumentCount,
  getCRMKPIData,
  getCRMVerificationCount,
  getPermitCount,
  getWaterPendingImports,
  getWaterCompletedImports
};
