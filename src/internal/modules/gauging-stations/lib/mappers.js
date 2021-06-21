'use strict';

const moment = require('moment');
const formatDate = date => moment(date).format('D MMMM YYYY');

const defaultToNA = item =>
  !item ? 'n/a' : item;

const defaultToZero = item =>
  !item ? '0' : item;

const defaultToMld = item =>
  !item ? 'Ml/d' : item;

/* Draft: Independent objects currently joined in frontend */
const mapStations = newData => {
  for (const rkey in newData.stations) {
    newData.stations[rkey].wiskiId = defaultToNA(newData.stations[rkey].wiskiId);
    newData.stations[rkey].easting = defaultToNA(newData.stations[rkey].easting);
    newData.stations[rkey].northing = defaultToNA(newData.stations[rkey].northing);
    newData.stations[rkey].tags = [];
    newData.stations[rkey].licences = [];
    newData.licences = [];
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
      newData.licences.push(licenceObj);
      newData.stations[rkey].licences.push(licenceObj);
    }
  }
  return newData;
};

const mapTags = newData => {
  for (const rkey in newData.stations) {
    if (newData.stations.hasOwnProperty(rkey)) {
      const tagObj = {
        licenceNumber: newData.stations[rkey].licenceRef,
        tagValues: []
      };
      const abstractionPeriod = {
        periodStart: 'n/a',
        periodEnd: 'n/a'
      };
      if (newData.stations[rkey].abstractionPeriodStartDay && newData.stations[rkey].abstractionPeriodStartMonth) {
        abstractionPeriod.periodStart = `${newData.stations[rkey].abstractionPeriodStartDay}/${newData.stations[rkey].abstractionPeriodStartMonth}`;
      }
      if (newData.stations[rkey].abstractionPeriodEndDay && newData.stations[rkey].abstractionPeriodEndMonth) {
        abstractionPeriod.periodEnd = `${newData.stations[rkey].abstractionPeriodEndDay}/${newData.stations[rkey].abstractionPeriodEndMonth}`;
      }
      const tagValueObj = {
        licenceNumber: newData.stations[rkey].licenceRef,
        abstractionPeriod: abstractionPeriod,
        conditionType: defaultToNA(newData.stations[rkey].restrictionType),
        thresholdValue: defaultToZero(newData.stations[rkey].thresholdValue)
      };
      tagValueObj.thresholdUnits = defaultToMld(newData.stations[rkey].thresholdUnit);
      tagObj.tagValues.push(tagValueObj);
      newData.stations[0].tags.push(tagObj);
    }
  }
  return newData;
};

const mapStationsLicences = data => {
  if (!data) { return null; }

  const newData = {
    stations: [],
    stationID: 0
  };
  const newStations = JSON.parse(JSON.stringify(data));
  newData.stations = newStations;
  return newData;
};

exports.mapStationsLicences = mapStationsLicences;
exports.mapStations = mapStations;
exports.mapTags = mapTags;
