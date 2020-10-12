const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');
const moment = require('moment');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

/**
 * Loads the licence specified in the params,
 * or a Boom 404 error if not found
 * @param {String} request.params.licenceId - licence ID from water.licences.licence_id
 * @param {Promise<Object>}
 */
const loadLicence = async request => {
  const { licenceId } = request.params;
  try {
    const data = await request.server.methods.cachedServiceRequest('water.licences.getLicenceById', licenceId);
    return data;
  } catch (err) {
    return errorHandler(err, `Licence ${licenceId} not found`);
  }
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
    const response = await services.water.changeReasons.getChangeReasons();
    return response.data.filter(reason => reason.type === type);
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

exports.loadBillingAccounts = loadBillingAccounts;
exports.loadChargeableChangeReasons = loadChargeableChangeReasons;
exports.loadDefaultCharges = loadDefaultCharges;
exports.loadDraftChargeInformation = loadDraftChargeInformation;
exports.loadLicence = loadLicence;
exports.loadIsChargeable = loadIsChargeable;
exports.loadNonChargeableChangeReasons = loadNonChargeableChangeReasons;
