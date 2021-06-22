const session = require('./session');
const services = require('../../../lib/connectors/services');
const { get, omit } = require('lodash');

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request);

  if (checkStageReached === true && !request.path.includes('/condition')) {
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
    const { data } = await services.water.licenceVersionPurposeConditionsService
      .getLicenceVersionPurposeConditionsByLicenceId(sessionData.fetchedLicence.id, { qs: { code: 'CES' } });
    return data;
  } catch (err) {
    return [];
  }
};

const getCaption = async request => {
  const { gaugingStationId } = request.params;
  const { label, catchmentName } = await services.water.gaugingStations.getGaugingStationbyId(gaugingStationId);
  return `${label}${catchmentName.length > 2 ? ' at ' + catchmentName : ''}`;
};

const getSelectedConditionText = request => {
  const { conditionsForSelectedLicence } = request.pre;
  const sessionData = session.get(request);
  const selectedCondition = get(sessionData, 'condition.value', null);

  if (selectedCondition) {
    return get(conditionsForSelectedLicence.find(x => x.licenceVersionPurposeConditionId === selectedCondition), 'notes', 'None');
  } else {
    return 'None';
  }
};

const deduceRestrictionTypeFromUnit = unit => {
  const flowUnits = [ 'Ml/d', 'm3/s', 'm3/d', 'l/s' ];
  if (flowUnits.includes(unit)) {
    return 'flow';
  }
  return 'level';
};

const handlePost = async request => {
  const { gaugingStationId } = request.params;
  const sessionData = session.get(request);
  const { id: licenceId } = sessionData.fetchedLicence;
  const licenceVersionPurposeConditionId = get(sessionData, 'condition.value', null);
  const thresholdValue = get(sessionData, 'threshold.value');
  const thresholdUnit = get(sessionData, 'unit.value');
  const startDate = get(sessionData, 'startDate.value');
  const startDay = startDate ? startDate.split('-')[1] : null;
  const startMonth = startDate ? startDate.split('-')[0] : null;
  const endDate = get(sessionData, 'endDate.value');
  const endDay = endDate ? endDate.split('-')[1] : null;
  const endMonth = endDate ? endDate.split('-')[0] : null;
  const restrictionType = deduceRestrictionTypeFromUnit(thresholdUnit);
  const alertType = get(sessionData, 'alertType.value');
  const volumeLimited = get(sessionData, 'volumeLimited.value');
  const reductionAlertType = volumeLimited === true ? 'stop_or_reduce' : 'reduce';
  const derivedAlertType = alertType === 'stop' ? 'stop' : reductionAlertType;
  const conditionId = licenceVersionPurposeConditionId.length > 0 ? licenceVersionPurposeConditionId : null;

  const parsedPayload = {
    thresholdUnit,
    thresholdValue,
    restrictionType,
    licenceVersionPurposeConditionId: conditionId,
    abstractionPeriod: {
      startDay: parseInt(startDay),
      startMonth: parseInt(startMonth),
      endDay: parseInt(endDay),
      endMonth: parseInt(endMonth)
    },
    alertType: derivedAlertType
  };

  // If the LVPC ID is supplied, the abstraction period is omitted.
  if (parsedPayload.licenceVersionPurposeConditionId.length === '36') {
    omit(parsedPayload, 'abstractionPeriod');
  }
  return services.water.gaugingStations.postLicenceLinkage(gaugingStationId, licenceId, parsedPayload);
};

exports.redirectTo = redirectTo;
exports.isLicenceNumberValid = isLicenceNumberValid;
exports.fetchConditionsForLicence = fetchConditionsForLicence;
exports.getCaption = getCaption;
exports.getSelectedConditionText = getSelectedConditionText;
exports.handlePost = handlePost;
