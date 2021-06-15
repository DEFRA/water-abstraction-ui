'use strict';

const moment = require('moment');
const formatDate = date => moment(date).format('D MMMM YYYY');

/* Draft: Independent objects currently joined in frontend */
const mapStations = (newData) => {
  for (var rkey in newData.stations) {
    if (!newData.stations[rkey].easting) {
      newData.stations[rkey].easting = 'n/a';
    }
    if (!newData.stations[rkey].northing) {
      newData.stations[rkey].northing = 'n/a';
    }
    if (!newData.stations[rkey].wiskiId) {
      newData.stations[rkey].wiskiId = 'n/a';
    } else {
      /* Rename to match template */
      newData.stations[rkey].wiskiID = newData.stations[rkey].wiskiId;
      delete newData.stations[rkey].wiskiId;
    }
    newData.stations[rkey].tags = [];
    newData.stations[rkey].licences = [];
    newData.licences = [];
    if (newData.stations.hasOwnProperty(rkey)) {
      let licenceObj = {};
      licenceObj.number = newData.stations[rkey].licenceRef;
      licenceObj.communications = [];
      let comObj = {};
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
  for (var rkey in newData.stations) {
    if (newData.stations.hasOwnProperty(rkey)) {
      let tagObj = {};
      tagObj.licenceNumber = newData.stations[rkey].licenceRef;
      tagObj.tagValues = [];
      let tagValueObj = {};
      tagValueObj.licenceNumber = newData.stations[rkey].licenceRef;
      let abstractionPeriod = { periodStart: '1/1', periodEnd: '31/12' };
      abstractionPeriod.periodStart = newData.stations[rkey].abstractionPeriodStartDay + '/' + newData.stations[rkey].abstractionPeriodStartMonth;
      abstractionPeriod.periodEnd = newData.stations[rkey].abstractionPeriodEndDay + '/' + newData.stations[rkey].abstractionPeriodEndMonth;
      if (!newData.stations[rkey].abstractionPeriodStartDay) {
        abstractionPeriod = 'n/a';
      }
      tagValueObj.abstractionPeriod = abstractionPeriod;
      if (!newData.stations[rkey].restrictionType) {
        newData.stations[rkey].restrictionType = 'n/a';
      } else {
        tagValueObj.conditionType = newData.stations[rkey].restrictionType;
      }
      if (!newData.stations[rkey].thresholdValue) {
        tagValueObj.thresholdValue = '0';
      } else {
        tagValueObj.thresholdValue = newData.stations[rkey].thresholdValue;
      }
      if (!newData.stations[rkey].thresholdUnit) {
        tagValueObj.thresholdUnits = 'Ml/d';
      } else {
        tagValueObj.thresholdUnits = newData.stations[rkey].thresholdUnit;
      }
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
  let newData = {};
  newData.stations = [];
  newData.stationID = 0;
  let newStations = JSON.parse(JSON.stringify(data));
  newData.stations = newStations;
  return newData;
};

exports.mapStationsLicences = mapStationsLicences;
exports.mapStations = mapStations;
exports.mapTags = mapTags;
