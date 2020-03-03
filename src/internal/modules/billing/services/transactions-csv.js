'use strict';
const moment = require('moment');

const getAbsStartAndEnd = absPeriod => {
  return {
    absStart: moment().month(absPeriod.startMonth - 1).date(absPeriod.startDay).format('D MMM'),
    absEnd: moment().month(absPeriod.endMonth - 1).date(absPeriod.endDay).format('D MMM')
  };
};

const getTransactionData = trans => {
  const { absStart, absEnd } = getAbsStartAndEnd(trans.chargeElement.abstractionPeriod);
  const agreements = trans.agreements.join(', ');

  return {
    value: trans.value,
    isCredit: trans.isCredit.toString(),
    isCompensationCharge: trans.isCompensationCharge.toString(),
    source: trans.chargeElement.source,
    season: trans.chargeElement.season,
    chargeElementPurposeCode: trans.chargeElement.purposeUse.code,
    chargeElementPurposeName: trans.chargeElement.purposeUse.name,
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
          isWaterUndertaker: invLic.licence.isWaterUndertaker.toString(),
          historicalArea: invLic.licence.historicalArea.code,
          ...getTransactionData(trans),
          ...getInvoiceAccountData(dataObj.invoiceAccount)
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
exports._getInvoiceAccountData = getInvoiceAccountData;
exports._getTransactionData = getTransactionData;
exports.createCSV = createCSV;
exports.getCSVFileName = getCSVFileName;
