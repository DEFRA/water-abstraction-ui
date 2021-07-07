const session = require('./session');
const services = require('../../../lib/connectors/services');
const { get, omit, set, chain } = require('lodash');

const blankGuid = '00000000-0000-0000-0000-000000000000';

const redirectTo = (request, h, path) => {
  const { checkStageReached } = session.get(request);

  if (checkStageReached === true && !['/condition', '/abstraction-period'].includes(path)) {
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
  const { label, riverName } = await services.water.gaugingStations.getGaugingStationbyId(gaugingStationId);
  return `${riverName ? riverName + ' at ' : ''}${label}`;
};

const getSelectedConditionText = request => {
  const { conditionsForSelectedLicence } = request.pre;
  const sessionData = session.get(request);
  const selectedCondition = get(sessionData, 'condition.value', null);

  if (selectedCondition) {
    return get(conditionsForSelectedLicence.find(x => x.id === selectedCondition), 'notes', 'None');
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

const createTitle = station =>
  !station.riverName ? `${station.label}` : `${station.riverName} at ${station.label}`;

const mapAbstractionPeriods = input => input.map(licence => ({
  licenceRef: licence.licenceRef,
  licenceId: licence.licenceId,
  linkages: licence.linkages.length > 0 ? licence.linkages.map(eachLink => {
    const abstractionPeriod = {
      startDay: eachLink.abstractionPeriodStartDay,
      startMonth: eachLink.abstractionPeriodStartMonth,
      endDay: eachLink.abstractionPeriodEndDay,
      endMonth: eachLink.abstractionPeriodEndMonth
    };
    return { ...eachLink, abstractionPeriod };
  }) : []
}));

const groupByLicence = inputArray => {
  const output = chain(inputArray).groupBy('licenceId').map((value, key) => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    linkages: value
  })).value();

  return mapAbstractionPeriods(output);
};

const handlePost = async request => {
  const { gaugingStationId } = request.params;
  const sessionData = session.get(request);

  const { id: licenceId } = sessionData.fetchedLicence;
  const storedLicenceVersionPurposeConditionIdFromSession = get(sessionData, 'condition.value', null);
  const licenceVersionPurposeConditionId = storedLicenceVersionPurposeConditionIdFromSession === blankGuid ? null : storedLicenceVersionPurposeConditionIdFromSession;
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

  const parsedPayload = {
    thresholdUnit,
    thresholdValue,
    restrictionType,
    licenceVersionPurposeConditionId,
    abstractionPeriod: {
      startDay: parseInt(startDay),
      startMonth: parseInt(startMonth),
      endDay: parseInt(endDay),
      endMonth: parseInt(endMonth)
    },
    alertType: derivedAlertType
  };

  // If the LVPC ID is supplied, the abstraction period is omitted.
  if (licenceVersionPurposeConditionId) {
    return services.water.gaugingStations.postLicenceLinkage(gaugingStationId, licenceId, omit(parsedPayload, ['abstractionPeriod']));
  }
  return services.water.gaugingStations.postLicenceLinkage(gaugingStationId, licenceId, set(parsedPayload, 'licenceVersionPurposeConditionId', null));
};

const handleRemovePost = async request => {
  const { gaugingStationId } = request.params;
  const sessionData = session.get(request);

  if (sessionData.selectedLicence) {
    const licenceGaugingStationId = sessionData.selectedLicence.value;
    return services.water.gaugingStations.postLicenceLinkageRemove(licenceGaugingStationId);
  }
};

const humanise = (str) => {
  str = str.replace('stop_or_reduce','Stop Or Reduce');
  str = str.replace('stop','Stop');
  str = str.replace('reduce','Reduce');
  return str;
};

const incrementDuplicates = (licenceRef, tempArr) => {
  tempArr.push(licenceRef);
  return tempArr.filter(item => {return item == licenceRef}).length;
};

const maxDuplicates = (items, label) => {
  return items.filter(item => {return item.licenceRef == label}).length;
};

exports.blankGuid = blankGuid;
exports.createTitle = createTitle;
exports.redirectTo = redirectTo;
exports.isLicenceNumberValid = isLicenceNumberValid;
exports.fetchConditionsForLicence = fetchConditionsForLicence;
exports.getCaption = getCaption;
exports.getSelectedConditionText = getSelectedConditionText;
exports.groupByLicence = groupByLicence;
exports.handlePost = handlePost;
exports.handleRemovePost = handleRemovePost;
exports.humanise = humanise;
exports.incrementDuplicates = incrementDuplicates;
exports.maxDuplicates = maxDuplicates;
