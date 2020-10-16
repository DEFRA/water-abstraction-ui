const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const { loadLicence } = require('shared/lib/pre-handlers/licences');
const moment = require('moment');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

/**
 * Loads draft charge information for the specified licence from the cache
 * @param {String} request.params.licenceId - licence ID from water.licences.licence_id
 * @param {Promise<Object>}
 */
const loadDraftChargeInformation = async request =>
  request.getDraftChargeInformation(request.params.licenceId);

const getFilteredChangeReasons = async type => {
  try {
    const changeReasons = await services.water.changeReasons.getChangeReasons();
    return changeReasons.filter(reason => reason.type === type);
  } catch (err) {
    return errorHandler(err, `Change reasons not found`);
  }
};

/**
 * Loads list of chargeable change reasons or a Boom 404 error if not found
 *
 * @param {Promise<Object>}
 */
const loadChargeableChangeReasons = () => getFilteredChangeReasons('new_chargeable_charge_version');

/**
 * Loads list of non chargeable change reasons or a Boom 404 error if not found
 *
 * @param {Promise<Object>}
 */
const loadNonChargeableChangeReasons = () => getFilteredChangeReasons('new_non_chargeable_charge_version');

const loadIsChargeable = async request => {
  const { changeReason } = request.pre.draftChargeInformation;
  return changeReason.type === 'new_chargeable_charge_version';
};

const getPaddedVersionString = version => version.toString().padStart(9, '0');
const getSortableVersionNumber = (issue, increment) => parseFloat(`${getPaddedVersionString(issue)}.${getPaddedVersionString(increment)}`);

const loadDefaultCharges = async request => {
  const { licenceId } = request.params;
  try {
    const draftChargeInfo = await loadDraftChargeInformation(request);
    const startDate = new Date(draftChargeInfo.dateRange.startDate);
    //  Find non 'draft' licence versions for the licenceId where the draft charge version start date is in the date range of
    //  licence versions then pick the licence version with the greatest version number.
    const versions = await services.water.licences.getLicenceVersions(licenceId);
    const version = versions.filter(v => {
      return v.status !== 'draft' && moment.range(v.startDate, v.endDate).contains(startDate);
    }).reduce((preVal, curVal) => {
      return (getSortableVersionNumber(preVal.issue, preVal.increment) > getSortableVersionNumber(curVal.issue, curVal.increment)) ? preVal : curVal;
    });

    if (version) {
      const defaultCharges = await services.water.chargeVersions.getDefaultChargesForLicenceVersion(version.id);
      return defaultCharges;
    }
    return [];
  } catch (err) {
    return errorHandler(err, `Default charges not found for licence ${licenceId}`);
  }
};

const loadBillingAccounts = async request => {
  const { licenceNumber, id } = request.pre.licence;
  const { startDate } = request.pre.draftChargeInformation.dateRange;

  try {
    const licenceAccounts = await services.water.licences.getLicenceAccountsByRefAndDate(licenceNumber, startDate);
    return licenceAccounts;
  } catch (err) {
    return errorHandler(err, `Cannot load billing accounts for licence ${id}`);
  }
};

const loadLicencesWithoutChargeVersions = async request => {
  //  TODO this endpoint hasn't been built yet.
  //  https://eaflood.atlassian.net/browse/WATER-2888
  return [];
};

const loadLicencesWithWorkflowsInProgress = async request => {
  try {
    const licencesWithWorkflowsInProgress = await services.water.chargeVersionWorkflows.getChargeVersionWorkflows();
    return licencesWithWorkflowsInProgress.data;
  } catch (err) {
    console.log(err);
    return errorHandler(err, `Could not retrieve licences with pending charge versions.`);
  }
};

const loadChargeVersion = async request => {
  const { chargeVersionId } = request.params;

  try {
    const chargeVersion = await services.water.chargeVersions.getChargeVersion(chargeVersionId);
    return chargeVersion;
  } catch (err) {
    return errorHandler(err, `Cannot load charge version ${chargeVersionId}`);
  }
};

const decorateChargeVersion = chargeVersionWorkflow => {
  const { chargeVersion, status } = chargeVersionWorkflow;
  // set id of saved address to display
  const invoiceAccountAddress = chargeVersion.invoiceAccount.invoiceAccountAddresses[0].id;
  return {
    ...chargeVersion,
    status,
    invoiceAccount: { ...chargeVersion.invoiceAccount, invoiceAccountAddress }
  };
};

const loadChargeVersionWorkflow = async request => {
  const { licenceId, chargeVersionWorkflowId } = request.params;

  try {
    const { chargeVersionWorkflow } = await services.water.chargeVersionWorkflows.getChargeVersionWorkflow(chargeVersionWorkflowId);
    const chargeVersion = decorateChargeVersion(chargeVersionWorkflow);
    request.setDraftChargeInformation(licenceId, chargeVersion);
    return chargeVersion;
  } catch (err) {
    return errorHandler(err, `Cannot load charge version workflow ${chargeVersionWorkflowId}`);
  }
};

const loadLicenceHolderRole = async request => {
  const { licenceId } = request.params;
  const { startDate } = request.pre.draftChargeInformation.dateRange;

  try {
    const { roles } = await services.water.licences.getValidDocumentByLicenceIdAndDate(licenceId, startDate);
    return roles.find(role => role.roleName === 'licenceHolder');
  } catch (err) {
    return errorHandler(err, `Cannot load document for licence ${licenceId} on ${startDate}`);
  }
};

const saveInvoiceAccount = async request => {
  const { invoiceAccountId } = request.query;
  const { licenceId } = request.params;
  const chargeInfo = request.getDraftChargeInformation(licenceId);
  if (invoiceAccountId) {
    try {
      const invoiceAccount = await services.water.invoiceAccounts.getInvoiceAccount(invoiceAccountId);
      chargeInfo.invoiceAccount = {
        ...invoiceAccount,
        invoiceAccountAddress: invoiceAccount.invoiceAccountAddresses[0].id
      };
      request.setDraftChargeInformation(licenceId, chargeInfo);
    } catch (err) {
      return errorHandler(err, `Cannot load invoice account ${invoiceAccountId}`);
    }
  }
  return chargeInfo;
};

exports.loadBillingAccounts = loadBillingAccounts;
exports.loadChargeableChangeReasons = loadChargeableChangeReasons;
exports.loadChargeVersion = loadChargeVersion;
exports.loadChargeVersionWorkflow = loadChargeVersionWorkflow;
exports.loadDefaultCharges = loadDefaultCharges;
exports.loadDraftChargeInformation = loadDraftChargeInformation;
exports.loadLicence = loadLicence;
exports.loadIsChargeable = loadIsChargeable;
exports.loadNonChargeableChangeReasons = loadNonChargeableChangeReasons;
exports.loadLicencesWithoutChargeVersions = loadLicencesWithoutChargeVersions;
exports.loadLicencesWithWorkflowsInProgress = loadLicencesWithWorkflowsInProgress;
exports.loadLicenceHolderRole = loadLicenceHolderRole;
exports.saveInvoiceAccount = saveInvoiceAccount;
