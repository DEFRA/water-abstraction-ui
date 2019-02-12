const { throwIfError } = require('@envage/hapi-pg-rest-api');
const IDM = require('../../../lib/connectors/idm');
const CRM = require('../../../lib/connectors/crm');
const permits = require('../../../lib/connectors/permit');
const water = require('../../../lib/connectors/water');

const firstPage = {
  perPage: 1
};

/**
 * Gets number of users in IDM
 * @return {Promise} Resolves with number of users
 */
const getIDMUserCount = async () => {
  const { pagination, error } = await IDM.usersClient.findMany({}, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
};

/**
 * Gets KPIs from IDM service
 * @return {Promise} resolves with array of IDM KPIs
 */
const getIDMKPIData = async () => {
  const { data, error } = await IDM.kpi.findMany({}, {}, {});
  throwIfError(error);
  return data;
};

/**
 * Gets number of documents imported to CRM
 * @return {Promise} resolves with number of CRM docs
 */
const getCRMDocumentCount = async () => {
  const { pagination, error } = await CRM.documents.findMany({}, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
};

/**
 * Gets KPIs from CRM
 * @return {Promise} resolves wtih array of CRM KPIs
 */
const getCRMKPIData = async () => {
  const { data, error } = await CRM.kpi.findMany({}, {}, {});
  throwIfError(error);
  return data;
};

/**
 * Gets number of verifications
 * @return {Promise} resolves with number of CRM verifications
 */
const getCRMVerificationCount = async () => {
  const { pagination, error } = await CRM.verification.findMany({}, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
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
  const { pagination, error } = await permits.licences.findMany(filter, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
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
  const { pagination, error } = await water.pendingImport.findMany(filter, {}, firstPage);
  throwIfError(error);
  return pagination.totalRows;
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
  getIDMUserCount,
  getIDMKPIData,
  getCRMDocumentCount,
  getCRMKPIData,
  getCRMVerificationCount,
  getPermitCount,
  getWaterPendingImports,
  getWaterCompletedImports
};
