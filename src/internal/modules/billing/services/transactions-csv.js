const { omit } = require('lodash');
const moment = require('moment');

const columnHeadings = [
  'licenceNumber', 'isCredit', 'isCompensationCharge', 'source', 'season', 'loss',
  'description', 'agreements', 'chargePeriodStartDate', 'chargePeriodEndDate',
  'authorisedDays', 'billableDays', 'absPeriodStartDate', 'absPeriodEndDate',
  'authorisedAnnualQuantity', 'billableAnnualQuantity', 'address', 'company',
  'invoiceAccountNumber', 'invoiceAccountCompany'
];

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

  return [
    trans.value,
    trans.isCredit.toString(),
    trans.isCompensationCharge.toString(),
    trans.chargeElement.source,
    trans.chargeElement.season,
    trans.chargeElement.loss,
    trans.description,
    agreements,
    trans.chargePeriod.startDate,
    trans.chargePeriod.endDate,
    trans.authorisedDays,
    trans.billableDays,
    absStart,
    absEnd,
    trans.chargeElement.authorisedAnnualQuantity,
    trans.chargeElement.billableAnnualQuantity
  ];
};

const getInvoiceLicenceData = invLic => {
  return [
    objToString(invLic.address),
    objToString(invLic.company)
  ];
};

const getInvoiceAccountData = invAcc => {
  return [
    invAcc.accountNumber,
    objToString(invAcc.company)
  ];
};

const createCSV = async data => {
  const dataForCSV = [columnHeadings];

  return data.reduce((dataForCSV, dataObj) => {
    dataObj.invoiceLicences.forEach(invLic => {
      invLic.transactions.forEach(trans => {
        const csvLine = [
          invLic.licence.licenceNumber,
          ...getTransactionData(trans),
          ...getInvoiceLicenceData(invLic),
          ...getInvoiceAccountData(dataObj.invoiceAccount)
        ];
        dataForCSV.push(csvLine);
      });
    });

    return dataForCSV;
  }, dataForCSV);
};

const getCSVFileName = batch => {
  return `${batch.region.name} ${batch.type} bill run ${batch.billRunDate.slice(0, 10)}.csv`;
};

exports._columnHeadings = columnHeadings;
exports._getTransactionData = getTransactionData;
exports._getInvoiceLicenceData = getInvoiceLicenceData;
exports._getInvoiceAccountData = getInvoiceAccountData;

exports.createCSV = createCSV;
exports.getCSVFileName = getCSVFileName;
