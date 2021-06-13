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
      licenceObj.number = newData.stations[rkey].licenceRef; /* temp number - no data */

      licenceObj.communications = [];
      let comObj = {};

      if (!newData.stations[rkey].comstatus) {
        comObj.sent = 'n/a';
      } else {
        comObj.sent = newData.stations[rkey].comstatus;
      }
      
      if (!newData.stations[rkey].dateStatusUpdated) {
        comObj.type = 'n/a';
      } else {
        comObj.type = formatDate(newData.stations[rkey].dateStatusUpdated);
      }

      licenceObj.communications.push(comObj);
      newData.licences.push(licenceObj);
      newData.stations[rkey].licences.push(licenceObj);
      
    }
  } 

return newData;
};

/* Draft: tags Mapping */
const mapTags = (newData) => {
  for (var rkey in newData.stations) {
    if (newData.stations.hasOwnProperty(rkey)) {
      let tagObj = {};
      tagObj.licenceNumber = newData.stations[rkey].licenceRef;
      tagObj.tagValues = []; 
      let tagValueObj = {};
      tagValueObj.licenceNumber = newData.stations[rkey].licenceRef;
      let abstractionPeriod = newData.stations[rkey].abstractionPeriodStartDay + '/' + newData.stations[rkey].abstractionPeriodStartMonth + ' to '; 
      abstractionPeriod += newData.stations[rkey].abstractionPeriodEndDay + '/' + newData.stations[rkey].abstractionPeriodEndMonth + ''; 
      
      if (!newData.stations[rkey].abstractionPeriodStartDay) {
        abstractionPeriod = 'n/a';
      }

      tagValueObj.abstractionPeriod = abstractionPeriod;
      
      /* Note: Import test data and change below to source from licence_gauging_stations; threshold_unit, threshold_value, restriction_type
      */

      /* example data: 
      03/28/60/0726 1 April to 31 October
      Reduce
      175
      Ml/d
      Resume  5 June 2020
      */
      if (!newData.stations[rkey].restrictionType) {
        newData.stations[rkey].restrictionType = 'n/a';
      } else {
        tagValueObj.conditionType = newData.stations[rkey].restrictionType;
      }

      if (!newData.stations[rkey].thresholdValue) {
        tagValueObj.thresholdValue = '0'
      } else {
        tagValueObj.thresholdValue = newData.stations[rkey].thresholdValue;
      }

      if (!newData.stations[rkey].thresholdUnit) {
        tagValueObj.thresholdUnits = 'Ml/d';
      } else {
        tagValueObj.thresholdUnits = newData.stations[rkey].thresholdUnit;
      }

      /*tagValueObj.status = newData.stations[rkey].status;
      tagValueObj.date_status_updated = formatDate(newData.stations[rkey].date_status_updated);
      */

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
