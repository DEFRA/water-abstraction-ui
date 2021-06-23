'use strict';

const moment = require('moment');
const cloneDeep = require('lodash.clonedeep');
const formatDate = date => moment(date).format('D MMMM YYYY');

const defaultToNA = item =>
  !item ? 'n/a' : item;

const defaultToZero = item =>
  !item ? '0' : item;

const defaultToMld = item =>
  !item ? 'Ml/d' : item;

/* Independent objects currently joined in frontend */
const mapStations = newData => {
  const stations = [];

  for (const rkey in newData.stations) {
    if (stations[rkey] === undefined) {
      stations.push({ stationID: rkey });
    }

    stations[rkey].riverName = newData.stations[rkey].riverName;
    stations[rkey].label = newData.stations[rkey].label;
    stations[rkey].stationReference = newData.stations[rkey].stationReference;
    stations[rkey].gridReference = newData.stations[rkey].gridReference;
    stations[rkey].abstractionPeriodStartDay = newData.stations[rkey].abstractionPeriodStartDay;
    stations[rkey].abstractionPeriodStartMonth = newData.stations[rkey].abstractionPeriodStartMonth;
    stations[rkey].abstractionPeriodEndDay = newData.stations[rkey].abstractionPeriodEndDay;
    stations[rkey].abstractionPeriodEndMonth = newData.stations[rkey].abstractionPeriodEndMonth;
    stations[rkey].licenceRef = newData.stations[rkey].licenceRef;
    stations[rkey].restrictionType = newData.stations[rkey].restrictionType;
    stations[rkey].thresholdValue = newData.stations[rkey].thresholdValue;
    stations[rkey].thresholdUnits = newData.stations[rkey].thresholdUnits;
    stations[rkey].wiskiId = defaultToNA(newData.stations[rkey].wiskiId);
    stations[rkey].easting = defaultToNA(newData.stations[rkey].easting);
    stations[rkey].northing = defaultToNA(newData.stations[rkey].northing);
    stations[rkey].licences = [];

    if (newData.stations.hasOwnProperty(rkey)) {
      const licenceObj = {
        number: newData.stations[rkey].licenceRef,
        communications: []
      };
      const comObj = {
        type: defaultToNA(newData.stations[rkey].comstatus),
        sent: 'n/a'
      };
      if (newData.stations[rkey].dateStatusUpdated) {
        comObj.sent = formatDate(newData.stations[rkey].dateStatusUpdated);
      }
      licenceObj.communications.push(comObj);
      stations[rkey].licences.push(licenceObj);
    }
  }
  return stations;
};

const mapTags = newData => {
  const tags = [];
  for (const rkey in newData.stations) {
    if (newData.stations.hasOwnProperty(rkey)) {
      const tagObj = {
        licenceNumber: newData.stations[rkey].licenceRef,
        tagValues: []
      };
      const abstractionPeriod = {
        startDay: newData.stations[rkey].abstractionPeriodStartDay,
        startMonth: newData.stations[rkey].abstractionPeriodStartMonth,
        endDay: newData.stations[rkey].abstractionPeriodEndDay,
        endMonth: newData.stations[rkey].abstractionPeriodEndMonth
      };
      const tagValueObj = {
        licenceNumber: newData.stations[rkey].licenceRef,
        abstractionPeriod: abstractionPeriod,
        conditionType: defaultToNA(newData.stations[rkey].restrictionType),
        thresholdValue: defaultToZero(newData.stations[rkey].thresholdValue)
      };
      tagValueObj.thresholdUnits = defaultToMld(newData.stations[rkey].thresholdUnit);
      tagObj.tagValues.push(tagValueObj);
      tags.push(tagObj);
    }
  }
  return tags;
};

const mapStationsLicences = data => {
  if (!data) {
    return null;
  }

  const newData = {
    stations: []
  };

  const newStations = cloneDeep(data);
  newData.stations = newStations;
  return newData;
};

exports.mapStationsLicences = mapStationsLicences;
exports.mapStations = mapStations;
exports.mapTags = mapTags;
