'use strict';

const moment = require('moment');
const formatDate = date => moment(date).format('D MMMM YYYY');

/* Draft: Independent objects currently joined in frontend */
const mapStations = (newData) => {
  for (let rkey in newData.stations) {
    if (!newData.stations[rkey].wiskiId) {
      newData.stations[rkey].wiskiId = 'n/a';
    }
    if (!newData.stations[rkey].easting) {
      newData.stations[rkey].easting = 'n/a';
    }
    if (!newData.stations[rkey].northing) {
      newData.stations[rkey].northing = 'n/a';
    }
    newData.stations[rkey].tags = [];
    newData.stations[rkey].licences = [];
    newData.licences = [];
    if (newData.stations.hasOwnProperty(rkey)) {
      const licenceObj = {};
      licenceObj.number = newData.stations[rkey].licenceRef;
      licenceObj.communications = [];
      const comObj = {};
      if (!newData.stations[rkey].comstatus) {
        comObj.type = 'n/a';
      } else {
        comObj.type = newData.stations[rkey].comstatus;
      }
      if (!newData.stations[rkey].dateStatusUpdated) {
        comObj.sent = 'n/a';
      } else {
        comObj.sent = formatDate(newData.stations[rkey].dateStatusUpdated);
      }
      licenceObj.communications.push(comObj);
      newData.licences.push(licenceObj);
      newData.stations[rkey].licences.push(licenceObj);
    }
  }
  return newData;
};

const mapTags = (newData) => {
  for (let rkey in newData.stations) {
    if (newData.stations.hasOwnProperty(rkey)) {
      const tagObj = {};
      tagObj.licenceNumber = newData.stations[rkey].licenceRef;
      tagObj.tagValues = [];
      const tagValueObj = {};
      tagValueObj.licenceNumber = newData.stations[rkey].licenceRef;
      const abstractionPeriod = { periodStart: '1/1', periodEnd: '31/12' };
      abstractionPeriod.periodStart = newData.stations[rkey].abstractionPeriodStartDay + '/' + newData.stations[rkey].abstractionPeriodStartMonth;
      abstractionPeriod.periodEnd = newData.stations[rkey].abstractionPeriodEndDay + '/' + newData.stations[rkey].abstractionPeriodEndMonth;
      if (!newData.stations[rkey].abstractionPeriodStartDay) {
        abstractionPeriod.periodStart = 'n/a';
      }
      if (!newData.stations[rkey].abstractionPeriodStartMonth) {
        abstractionPeriod.periodStart = 'n/a';
      }
      tagValueObj.abstractionPeriod = abstractionPeriod;
      if (!newData.stations[rkey].restrictionType) {
        newData.stations[rkey].restrictionType = 'n/a';
      }
      tagValueObj.conditionType = newData.stations[rkey].restrictionType;
      if (!newData.stations[rkey].thresholdValue) {
        newData.stations[rkey].thresholdValue = '0';
      }
      tagValueObj.thresholdValue = newData.stations[rkey].thresholdValue;
      if (!newData.stations[rkey].thresholdUnit) {
        newData.stations[rkey].thresholdUnit = 'Ml/d';
      }
      tagValueObj.thresholdUnits = newData.stations[rkey].thresholdUnit;
      tagObj.tagValues.push(tagValueObj);
      newData.stations[0].tags.push(tagObj);
    }
  }
  return newData;
};

const mapStationsLicences = (data) => {
  if (!data) {
    return null;
  }
  const newData = {};
  newData.stations = [];
  newData.stationID = 0;
  const newStations = JSON.parse(JSON.stringify(data));
  newData.stations = newStations;
  return newData;
};

exports.mapStationsLicences = mapStationsLicences;
exports.mapStations = mapStations;
exports.mapTags = mapTags;
