const Boom = require('@hapi/boom');
const services = require('../../lib/connectors/services');

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
    const data = request.server.methods.cachedServiceRequest('water.licences.getLicenceById', licenceId);
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
const loadDraftChargeInformation = async request => {
  const { licenceId } = request.params;
  try {
    const data = await request.server.methods.getDraftChargeInformation(licenceId);
    return data;
  } catch (err) {
    return errorHandler(err, `Draft charge information not found for licence ${licenceId}`);
  }
};

/**
 * Loads list of change reasons
 * or a Boom 404 error if not found
 * @param {String} request.params.licenceId - licence ID from water.licences.licence_id
 * @param {Promise<Object>}
 */
const loadChangeReasons = async request => {
  try {
    const response = await services.water.changeReasons.getChangeReasons();
    return response.data;
  } catch (err) {
    return errorHandler(err, `Change reasons not found`);
  }
};

exports.loadLicence = loadLicence;
exports.loadDraftChargeInformation = loadDraftChargeInformation;
exports.loadChangeReasons = loadChangeReasons;
