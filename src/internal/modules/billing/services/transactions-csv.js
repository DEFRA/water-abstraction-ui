'use strict';
const moment = require('moment');
const numberFormatter = require('../../../../shared/lib/number-formatter');
const { mapValues, isNull } = require('lodash');

const valueToString = (value, key) => isNull(value) ? '' : value.toString();
const rowToStrings = row => mapValues(row, valueToString);

const getAbsStartAndEnd = absPeriod => {
  return {
    absPeriodStartDate: moment().month(absPeriod.startMonth - 1).date(absPeriod.startDay).format('D MMM'),
    absPeriodEndDate: moment().month(absPeriod.endMonth - 1).date(absPeriod.endDay).format('D MMM')
  };
};

const getTransactionData = trans => ({
  value: numberFormatter.penceToPound(trans.value, true),
  isCredit: trans.isCredit,
  isCompensationCharge: trans.isCompensationCharge,
  source: trans.chargeElement.source,
  season: trans.chargeElement.season,
  loss: trans.chargeElement.loss,
  chargeElementPurposeCode: trans.chargeElement.purposeUse.code,
  chargeElementPurposeName: trans.chargeElement.purposeUse.name,
  description: trans.description,
  agreements: trans.agreements.join(', '),
  chargePeriodStartDate: trans.chargePeriod.startDate,
  chargePeriodEndDate: trans.chargePeriod.endDate,
  authorisedDays: trans.authorisedDays,
  billableDays: trans.billableDays,
  ...getAbsStartAndEnd(trans.chargeElement.abstractionPeriod),
  authorisedAnnualQuantity: trans.chargeElement.authorisedAnnualQuantity,
  billableAnnualQuantity: trans.chargeElement.billableAnnualQuantity,
  calculatedVolume: trans.calculatedVolume,
  volume: trans.volume
});

const getInvoiceAccountData = invoiceAccount => {
  return {
    accountNumber: invoiceAccount.accountNumber,
    companyName: invoiceAccount.company.name,
    addressLine1: invoiceAccount.address.addressLine1,
    addressLine2: invoiceAccount.address.addressLine2,
    addressLine3: invoiceAccount.address.addressLine3,
    addressLine4: invoiceAccount.address.addressLine4,
    town: invoiceAccount.address.town,
    county: invoiceAccount.address.county,
    postcode: invoiceAccount.address.postcode,
    country: invoiceAccount.address.country
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
          historicalArea: invLic.licence.historicalArea.code,
          ...getTransactionData(trans),
          ...getInvoiceAccountData(dataObj.invoiceAccount)
        };
        dataForCSV.push(rowToStrings(csvLine));
      });
    });
    return dataForCSV;
  }, dataForCSV);
};

const getCSVFileName = batch => {
  return `${batch.region.displayName} ${batch.type} bill run ${batch.billRunId}.csv`;
};
exports._getInvoiceAccountData = getInvoiceAccountData;
exports._getTransactionData = getTransactionData;
exports.createCSV = createCSV;
exports.getCSVFileName = getCSVFileName;
