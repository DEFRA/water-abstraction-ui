'use strict';
const moment = require('moment');
const numberFormatter = require('../../../../shared/lib/number-formatter');
const { mapValues, isNull } = require('lodash');
const mappers = require('../lib/mappers');

const isNullOrUndefined = value => isNull(value) || value === undefined;
const valueToString = value => isNullOrUndefined(value) ? '' : value.toString();
const rowToStrings = row => mapValues(row, valueToString);

const getAbsStartAndEnd = absPeriod => {
  return {
    absPeriodStartDate: moment().month(absPeriod.startMonth - 1).date(absPeriod.startDay).format('D MMM'),
    absPeriodEndDate: moment().month(absPeriod.endMonth - 1).date(absPeriod.endDay).format('D MMM')
  };
};

const getAgreementsString = agreements => agreements.map(agreement => agreement.code).join(', ');

const getChargeElementData = trans => {
  if (trans.isMinimumCharge) return {};
  return { source: trans.chargeElement.source,
    season: trans.chargeElement.season,
    loss: trans.chargeElement.loss,
    chargeElementPurposeCode: trans.chargeElement.purposeUse.code,
    chargeElementPurposeName: trans.chargeElement.purposeUse.name,
    ...getAbsStartAndEnd(trans.chargeElement.abstractionPeriod),
    authorisedAnnualQuantity: trans.chargeElement.authorisedAnnualQuantity,
    billableAnnualQuantity: trans.chargeElement.billableAnnualQuantity
  };
};

const getTransactionData = trans => ({
  value: numberFormatter.penceToPound(trans.value, true),
  isDeMinimis: trans.isDeMinimis,
  isCredit: trans.isCredit,
  isCompensationCharge: trans.isCompensationCharge,
  ...getChargeElementData(trans),
  description: trans.description,
  agreements: getAgreementsString(trans.agreements),
  chargePeriodStartDate: trans.chargePeriod.startDate,
  chargePeriodEndDate: trans.chargePeriod.endDate,
  authorisedDays: trans.authorisedDays,
  billableDays: trans.billableDays,
  calculatedVolume: trans.billingVolume ? trans.billingVolume.calculatedVolume : null,
  volume: trans.volume
});

const getInvoiceAccountData = invoiceAccount => {
  return {
    accountNumber: invoiceAccount.accountNumber,
    companyName: invoiceAccount.company.name
  };
};

const createCSV = async data => {
  const dataForCSV = [];
  return data.reduce((dataForCSV, dataObj) => {
    dataObj.invoiceLicences.forEach(invLic => {
      invLic.transactions.forEach(trans => {
        const csvLine = {
          licenceNumber: invLic.licence.licenceNumber,
          region: invLic.licence.region.displayName,
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
  const batchType = mappers.mapBatchType(batch.type);
  return `${batch.region.displayName} ${batchType.toLowerCase()} bill run ${batch.billRunNumber}.csv`;
};
exports._getInvoiceAccountData = getInvoiceAccountData;
exports._getTransactionData = getTransactionData;
exports.createCSV = createCSV;
exports.getCSVFileName = getCSVFileName;
