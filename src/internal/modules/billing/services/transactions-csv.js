'use strict';
const { omit } = require('lodash');
const moment = require('moment');

const getAbsStartAndEnd = absPeriod => {
  return {
    absStart: moment().month(absPeriod.startMonth - 1).date(absPeriod.startDay).format('D MMM'),
    absEnd: moment().month(absPeriod.endMonth - 1).date(absPeriod.endDay).format('D MMM')
  };
};

const objToString = obj => JSON.stringify(omit(obj, ['id', 'type']));

const getTransactionData = trans => {
  const { absStart, absEnd } = getAbsStartAndEnd(trans.chargeElement.abstractionPeriod);
  const agreements = trans.agreements.join(', ');

  return {
    value: trans.value,
    isCredit: trans.isCredit.toString(),
    isCompensationCharge: trans.isCompensationCharge.toString(),
    source: trans.chargeElement.source,
    season: trans.chargeElement.season,
    chargeElementPurpose: objToString(trans.chargeElement.purposeUse),
    loss: trans.chargeElement.loss,
    description: trans.description,
    agreements,
    chargePeriodStartDate: trans.chargePeriod.startDate,
    chargePeriodEndDate: trans.chargePeriod.endDate,
    authorisedDays: trans.authorisedDays,
    billableDays: trans.billableDays,
    absPeriodStartDate: absStart,
    absPeriodEndDate: absEnd,
    authorisedAnnualQuantity: trans.chargeElement.authorisedAnnualQuantity,
    billableAnnualQuantity: trans.chargeElement.billableAnnualQuantity
  };
};

const createCSV = async data => {
  const dataForCSV = [];
  return data.reduce((dataForCSV, dataObj) => {
    dataObj.invoiceLicences.forEach(invLic => {
      invLic.transactions.forEach(trans => {
        const csvLine = {
          licenceNumber: invLic.licence.licenceNumber,
          region: invLic.licence.region.name,
          isWaterUndertaker: invLic.licence.isWaterUndertaker,
          historicalArea: objToString(invLic.licence.historicalArea),
          ...getTransactionData(trans),
          invoiceAccountNumber: dataObj.invoiceAccount.accountNumber,
          invoiceAccountCompanyName: dataObj.invoiceAccount.company.name,
          invoiceAccountCompanyAddress: objToString(dataObj.invoiceAccount.company.address)
        };
        dataForCSV.push(csvLine);
      });
    });
    return dataForCSV;
  }, dataForCSV);
};

const getCSVFileName = batch => {
  return `${batch.region.name} ${batch.type} bill run ${batch.dateCreated.slice(0, 10)}.csv`;
};
exports._getTransactionData = getTransactionData;
exports.createCSV = createCSV;
exports.getCSVFileName = getCSVFileName;
