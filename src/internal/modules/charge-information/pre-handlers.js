const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const { loadLicence } = require('shared/lib/pre-handlers/licences');
const moment = require('moment');
const { get, sortBy } = require('lodash');
const uuid = require('uuid');

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
const loadDraftChargeInformation = async request => request.getDraftChargeInformation(request.params.licenceId);

const getFilteredChangeReasons = async type => {
  try {
    const { data: changeReasons } = await services.water.changeReasons.getChangeReasons();
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
  const type = get(request, 'pre.draftChargeInformation.changeReason.type');
  return type === 'new_chargeable_charge_version';
};

const getPaddedVersionString = version => version.toString().padStart(9, '0');
const getSortableVersionNumber = obj => parseFloat(`${getPaddedVersionString(obj.issue)}.${getPaddedVersionString(obj.increment)}`);

const loadDefaultCharges = async request => {
  const { licenceId } = request.params;
  try {
    const draftChargeInfo = await loadDraftChargeInformation(request);
    const startDate = new Date(draftChargeInfo.dateRange.startDate);
    //  Find non 'draft' licence versions for the licenceId where the draft charge version start date is in the date range of
    //  licence versions then pick the licence version with the greatest version number.
    const versions = await services.water.licences.getLicenceVersions(licenceId);
    const versionsFiltered = versions.filter(v => {
      return v.status !== 'draft' && moment.range(v.startDate, v.endDate).contains(startDate);
    });

    const version = sortBy(versionsFiltered, getSortableVersionNumber).pop();

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
  try {
    const response = await services.water.chargeVersionWorkflows.getLicencesWithoutChargeInformation();
    const parsedResponse = response.data
      .filter(row => row.licence.expiredDate !== null && moment(row.licence.expiredDate).isAfter(new Date()))
      .sort((rowA, rowB) => new Date(rowA.licence.startDate) - new Date(rowB.licence.startDate));
    return parsedResponse;
  } catch (err) {
    return errorHandler(err, `Could not retrieve list of licences without charge versions.`);
  }
};

const loadLicencesWithWorkflowsInProgress = async request => {
  try {
    const licencesWithWorkflowsInProgress = await services.water.chargeVersionWorkflows.getChargeVersionWorkflows();
    return licencesWithWorkflowsInProgress.data.sort((rowA, rowB) => new Date(rowB.startDate) - new Date(rowA.startDate));
  } catch (err) {
    return errorHandler(err, `Could not retrieve licences with pending charge versions.`);
  }
};

const loadChargeVersions = async request => {
  const { licenceId } = request.params;
  try {
    const chargeVersions = await services.water.chargeVersions.getChargeVersionsByLicenceId(licenceId);
    return chargeVersions.filter(cv => (cv.status === 'current' || cv.status === 'superseded'))
      .sort((rowA, rowB) => new Date(rowB.dateRange.startDate) - new Date(rowA.dateRange.startDate));
  } catch (err) {
    return errorHandler(err, `Cannot load charge versions for licence ${licenceId}`);
  };
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
  const { chargeVersion, status, approverComments } = chargeVersionWorkflow;
  // set id of saved address to display
  const invoiceAccountAddress = get(chargeVersion, 'invoiceAccount.invoiceAccountAddresses[0].id', null);

  const modifiedChargeVersion = chargeVersion;
  // Give each charge element a GUID if it doesn't have one
  modifiedChargeVersion.chargeElements.map(element => {
    if (!element.id) {
      element['id'] = uuid();
    }
  });

  return {
    ...modifiedChargeVersion,
    status,
    approverComments,
    invoiceAccount: { ...chargeVersion.invoiceAccount, invoiceAccountAddress }
  };
};

const loadChargeVersionWorkflow = async request => {
  const { licenceId, chargeVersionWorkflowId } = request.params;
  try {
    const { chargeVersionWorkflow } = await services.water.chargeVersionWorkflows.getChargeVersionWorkflow(chargeVersionWorkflowId);
    const chargeVersion = decorateChargeVersion(chargeVersionWorkflow);

    request.setDraftChargeInformation(licenceId, { ...chargeVersion, chargeVersionWorkflowId });
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
exports.loadChargeVersions = loadChargeVersions;
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
