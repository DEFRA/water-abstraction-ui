const services = require('internal/lib/connectors/services');
const Boom = require('@hapi/boom');
const agreementDescriptions = require('./lib/descriptions');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

const decorateAgreementWithDescription = agreement => {
  agreement.description = agreementDescriptions[agreement.code];
  return agreement;
};

const loadAgreement = async request => {
  const { agreementId } = request.params;
  try {
    const agreement = await services.water.agreements.getAgreement(agreementId);
    return decorateAgreementWithDescription(agreement);
  } catch (err) {
    return errorHandler(err, `Agreement ${agreementId} not found`);
  }
};

const loadLicence = request => {
  const { licenceId } = request.params;
  try {
    const licence = services.water.licences.getLicenceById(licenceId);
    return licence;
  } catch (err) {
    return errorHandler(err, `Licence ${licenceId} not found`);
  }
};

const loadDocument = async request => {
  const { licenceNumber } = await loadLicence(request);
  try {
    const documentHeader = services.crm.documents.getWaterLicence(licenceNumber);
    return documentHeader;
  } catch (err) {
    return errorHandler(err, `Document for licence ${licenceNumber} not found in CRM`);
  }
};

exports.loadAgreement = loadAgreement;
exports.loadLicence = loadLicence;
exports.loadDocument = loadDocument;
