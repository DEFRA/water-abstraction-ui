const services = require('internal/lib/connectors/services');
const { logger } = require('../../logger');

const viewOptions = { layout: false };

const getLicenceNumber = request => request.licence.licence.licence_ref;

const getEarliestEndDate = request => request.licence.licence.earliestEndDate;

const getBackLink = request => {
  const { documentId } = request.params;
  const basePath = getEarliestEndDate(request) ? '/expired-licences' : '/licences';
  return `${basePath}/${documentId}#charge`;
};

/**
 * Displays the charge version
 * @param  {String}  request.params.documentId - the ID of the CRM document header
 * @param {String} request.params.chargeVersionId - the ID of the water service charge version
 */
const getChargeVersion = async (request, h) => {
  const { documentId, chargeVersionId } = request.params;
  const licenceNumber = getLicenceNumber(request);

  try {
    const chargeVersion = await services.water.chargeVersions.getChargeVersion(chargeVersionId);

    const view = {
      ...request.view,
      licenceTitle: `Licence number ${licenceNumber}`,
      back: getBackLink(request),
      pageTitle: `Licence charge for ${licenceNumber}`,
      chargeVersion
    };

    return h.view('nunjucks/charging/charge-version.njk', view, viewOptions);
  } catch (err) {
    logger.error(`getChargeVersion error`, err, { documentId, chargeVersionId });
    throw err;
  }
};

exports.getChargeVersion = getChargeVersion;
