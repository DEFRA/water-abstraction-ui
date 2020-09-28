'use strict';

const services = require('internal/lib/connectors/services');
const Boom = require('@hapi/boom');
const agreementMapper = require('../../../shared/lib/mappers/agreements');
const { getSessionData } = require('./lib/helpers');

const errorHandler = (err, message) => {
  if (err.statusCode === 404) {
    return Boom.notFound(message);
  }
  throw err;
};

const decorateAgreementWithDescription = licenceAgreement => ({
  ...licenceAgreement,
  agreement: agreementMapper.mapAgreement(licenceAgreement.agreement)
});

const loadAgreement = async request => {
  const { agreementId } = request.params;
  try {
    const agreement = await services.water.agreements.getAgreement(agreementId);
    return decorateAgreementWithDescription(agreement);
  } catch (err) {
    return errorHandler(err, `Agreement ${agreementId} not found`);
  }
};

const getFlowState = request => getSessionData(request);

exports.loadAgreement = loadAgreement;
exports.getFlowState = getFlowState;
