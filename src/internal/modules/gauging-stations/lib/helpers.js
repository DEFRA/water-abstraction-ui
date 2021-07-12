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
  const sessionData = session.get(request);
  let promises = [];
  if (sessionData.selectedCondition) {
    if (sessionData.selectedCondition.value) {
      sessionData.selectedLicence = null;
      const selectArr = sessionData.selectedCondition.value;
      promises = selectArr.map(licenceGaugingStationId => services.water.gaugingStations.postLicenceLinkageRemove(licenceGaugingStationId));
    }
  } else if (sessionData.selectedLicence && sessionData.selectedLicence.value) {
    const arrayOfLicenceGaugingStationsRecords = sessionData.selectedLicence.options.choices;
    promises = arrayOfLicenceGaugingStationsRecords.map(row => services.water.gaugingStations.postLicenceLinkageRemove(row.licenceGaugingStationId));
  }
  return Promise.all(promises);
};

const humaniseAlertType = str => {
  str = str.replace('stop_or_reduce', 'Reduce');
  str = str.replace('stop', 'Stop');
  str = str.replace('reduce', 'Reduce');
  return str;
};

const humaniseUnits = str => {
  str = str.replace('gal', 'Gallons');
  str = str.replace('Ml', 'Megalitres');
  str = str.replace('m³', 'Cubic metres');
  str = str.replace('l/', 'Litres/');
  str = str.replace('/d', ' per day');
  return str;
};

const detailedLabel = (labelData, licenceRef, dupeNum) => {
  const labelItem = labelData.filter(item => item.licenceRef === licenceRef)[dupeNum - 1];
  return ` ${humaniseAlertType(labelItem.alertType)} at ${labelItem.thresholdValue} ${humaniseUnits(labelItem.thresholdUnit)}`;
};

const selectedConditionWithLinkages = request => {
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;
  const isSelectedCheckbox = (licenceGaugingStationId, selectionArray) =>
    selectionArray.filter(chkItem => chkItem === licenceGaugingStationId).length > 0;

  const dataFormatted = data.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      licenceId: item.licenceId,
      licenceRef: item.licenceRef,
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: humaniseUnits(item.thresholdUnit)
    };
  });

  const checkBoxSelection = session.get(request).selectedCondition.value;
  const output = chain(dataFormatted).groupBy('licenceId').map(value => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    linkages: value.length <= 0 ? [] : value.filter(itemInLinkages => isSelectedCheckbox(itemInLinkages.licenceGaugingStationId, checkBoxSelection))
  })).value();

  return output.filter(chkItem => chkItem.linkages.length > 0);
};

const addCheckboxFields = dataWithoutDistinct => {
  return dataWithoutDistinct.map(itemWithoutDistinct => {
    return {
      licenceGaugingStationId: itemWithoutDistinct.licenceGaugingStationId,
      licenceId: itemWithoutDistinct.licenceId,
      licenceRef: itemWithoutDistinct.licenceRef,
      value: itemWithoutDistinct.licenceGaugingStationId,
      label: ` ${humaniseAlertType(itemWithoutDistinct.alertType)} at ${itemWithoutDistinct.thresholdValue} ${humaniseUnits(itemWithoutDistinct.thresholdUnit)}`,
      hint: itemWithoutDistinct.licenceRef,
      alertType: itemWithoutDistinct.alertType,
      thresholdValue: itemWithoutDistinct.thresholdValue,
      thresholdUnit: humaniseUnits(itemWithoutDistinct.thresholdUnit),
      dupeMax: itemWithoutDistinct.dupeMax
    };
  });
};

const groupLicenceConditions = request => {
  const { licenceGaugingStations } = request.pre;
  const { data } = licenceGaugingStations;

  const dataFormatted = data.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      licenceId: item.licenceId,
      licenceRef: item.licenceRef,
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: item.thresholdUnit
    };
  });

  const output = chain(dataFormatted).groupBy('licenceId').map(value => ({
    licenceRef: value[0].licenceRef,
    licenceId: value[0].licenceId,
    licenceGaugingStationId: value[0].licenceGaugingStationId,
    alertType: value[0].alertType,
    thresholdValue: value[0].thresholdValue,
    thresholdUnit: value[0].thresholdUnit,
    linkages: value
  })).value();

  return output.map(item => {
    return {
      licenceGaugingStationId: item.licenceGaugingStationId,
      licenceId: item.licenceId,
      licenceRef: item.licenceRef,
      alertType: item.alertType,
      thresholdValue: item.thresholdValue,
      thresholdUnit: item.thresholdUnit,
      dupeNum: item.linkages ? 1 : item.linkages.length,
      linkages: addCheckboxFields(item.linkages)
    };
  });
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
exports.humaniseAlertType = humaniseAlertType;
exports.humaniseUnits = humaniseUnits;
exports.detailedLabel = detailedLabel;
exports.selectedConditionWithLinkages = selectedConditionWithLinkages;
exports.groupLicenceConditions = groupLicenceConditions;
