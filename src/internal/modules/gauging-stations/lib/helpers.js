const session = require('./session');
const services = require('../../../lib/connectors/services');

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request);

  if (checkStageReached === true) {
    // eslint-disable-next-line no-useless-escape
    return h.redirect(request.path.replace(/\/[^\/]*$/, '/check'));
  } else {
    // eslint-disable-next-line no-useless-escape
    return h.redirect(request.path.replace(/\/[^\/]*$/, path));
  }
};

const isLicenceNumberValid = async request => {
  try {
    const licence = await services.water.licences.getLicenceByLicenceNumber(request.payload.licenceNumber);
    session.merge(request, {
      fetchedLicence: licence
    });
    return !!licence;
  } catch (err) {
    session.merge(request, {
      fetchedLicence: undefined
    });
    return false;
  }
};

const fetchConditionsForLicence = async request => {
  try {
    const sessionData = session.get(request);
    const { data } = await services.water.licenceVersionPurposeConditionsService.getLicenceVersionPurposeConditionsByLicenceId(sessionData.fetchedLicence.id, { qs: { code: 'CES' } });
    return data || [];
  } catch (err) {
    return [];
  }
};

exports.redirectTo = redirectTo;
exports.isLicenceNumberValid = isLicenceNumberValid;
exports.fetchConditionsForLicence = fetchConditionsForLicence;
