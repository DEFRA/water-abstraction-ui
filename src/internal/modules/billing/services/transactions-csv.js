'use strict'

const moment = require('moment')
const numberFormatter = require('../../../../shared/lib/number-formatter')
const { mapValues, sortBy, get } = require('lodash')
const mappers = require('../lib/mappers')
const { logger } = require('../../../logger')

const createCSV = async (invoices, chargeVersions, scheme) => {
  const sortedInvoices = sortBy(invoices, 'invoiceAccountaNumber', 'billingInvoiceLicences[0].licence.licenceRef')
  const dataForCSV = []

  sortedInvoices.forEach(invoice => {
    invoice.billingInvoiceLicences.forEach(invoiceLicence => {
      invoiceLicence.billingTransactions.forEach(transaction => {
        let csvLine

        switch (scheme) {
          case 'alcs':
            csvLine = _csvLineAlcs(invoice, invoiceLicence, transaction, chargeVersions)
            break
          case 'sroc':
            csvLine = _csvLineSroc(invoice, invoiceLicence, transaction, chargeVersions)
            break
          default:
            logger.error(`Scheme ${scheme} not recognised when exporting batch ${invoice.billingBatchId}`)
        }
        dataForCSV.push(csvLine)
      })
    })
  })

  return dataForCSV
}

const getCSVFileName = batch => {
  const batchType = mappers.mapBatchType(batch.type)
  return `${batch.region.displayName} ${batchType.toLowerCase()} bill run ${batch.billRunNumber}.csv`
}

function _csvLineAlcs (invoice, invoiceLicence, transaction, chargeVersions) {
  const csvLine = {
    'Billing account number': invoice.invoiceAccount.invoiceAccountNumber,
    'Customer name': invoice.invoiceAccount.company.name,
    'Licence number': invoiceLicence.licenceRef,
    'Bill number': invoice.invoiceNumber,
    'Financial year': invoice.financialYearEnding,
    'Invoice amount': _debitLineValue(invoice.isCredit, invoice.netAmount),
    'Credit amount': _creditLineValue(invoice.isCredit, invoice.netAmount),
    'Net transaction line amount(debit)': _transactionLineValue(true, transaction.isCredit, transaction.netAmount),
    'Net transaction line amount(credit)': _transactionLineValue(false, transaction.isCredit, transaction.netAmount),
    'Charge information reason': _changeReason(chargeVersions, transaction),
    Region: invoiceLicence.licence.region.displayName,
    'De minimis rule Y/N': invoice.isDeMinimis ? 'Y' : 'N',
    'Transaction description': transaction.description,
    'Water company Y/N': invoiceLicence.licence.isWaterUndertaker ? 'Y' : 'N',
    'Historical area': invoiceLicence.licence.regions.historicalAreaCode,
    'Compensation charge Y/N': transaction.isCompensationCharge ? 'Y' : 'N',
    // This uses the spread operator and a logical AND short circuit evaluation to allow us to determine whether the
    // following columns are added to the output or not. Thanks to https://stackoverflow.com/a/40560953/6117745 for
    // this
    ...(transaction.chargeType !== 'minimum_charge' && {
      'Standard Unit Charge (SUC) (£/1000 cubic metres)': transaction.calcSucFactor,
      'Environmental Improvement Unit Charge (EIUC) (£/1000 cubic metres)': transaction.calcEiucFactor,
      'Authorised annual quantity (megalitres)': transaction.chargeElement.authorisedAnnualQuantity,
      'Billable annual quantity (megalitres)': transaction.chargeElement.billableAnnualQuantity,
      'Source type': transaction.chargeElement.source,
      'Source factor': transaction.calcSourceFactor,
      'Adjusted source type': transaction.chargeElement.source === 'tidal' ? 'tidal' : 'other',
      'Adjusted source factor': transaction.calcEiucSourceFactor,
      Season: transaction.chargeElement.season,
      'Season factor': transaction.calcSeasonFactor,
      Loss: transaction.chargeElement.loss,
      'Loss factor': transaction.calcLossFactor,
      'Purpose code': transaction.chargeElement.purposeUse.legacyId,
      'Purpose name': transaction.chargeElement.purposeUse.description,
      'Abstraction period start date': moment()
      .month(transaction.abstractionPeriod.startMonth - 1)
      .date(transaction.abstractionPeriod.startDay)
      .format('D MMM'),
      'Abstraction period end date': moment()
      .month(transaction.abstractionPeriod.endMonth - 1)
      .date(transaction.abstractionPeriod.endDay)
      .format('D MMM')
    }),
    'Charge period start date': transaction.startDate,
    'Charge period end date': transaction.endDate,
    'Authorised days': transaction.authorisedDays,
    'Billable days': transaction.billableDays,
    'Calculated quantity': _billingVolume(transaction),
    Quantity: transaction.volume,
    'S127 agreement (Y/N)': transaction.section127Agreement ? 'Y' : 'N',
    'S127 agreement value': transaction.calcS127Factor || null,
    'S130 agreement': transaction.section130Agreement,
    'S130 agreement value': null
  }

  return _rowToStrings(csvLine)
}

function _csvLineSroc(invoice, invoiceLicence, transaction, chargeVersions) {
  const csvLine = {
    'Billing account number': invoice.invoiceAccount.invoiceAccountNumber,
    'Customer name': invoice.invoiceAccount.company.name,
    'Licence number': invoiceLicence.licenceRef,
    'Bill number': invoice.invoiceNumber,
    'Financial year': invoice.financialYearEnding,
    'Invoice amount': _debitLineValue(invoice.isCredit, invoice.netAmount),
    'Credit amount': _creditLineValue(invoice.isCredit, invoice.netAmount),
    'Net transaction line amount(debit)': _transactionLineValue(true, transaction.isCredit, transaction.netAmount),
    'Net transaction line amount(credit)': _transactionLineValue(false, transaction.isCredit, transaction.netAmount),
    'Charge period start date': transaction.startDate,
    'Charge period end date': transaction.endDate,
    'Authorised days': transaction.authorisedDays,
    'Billable days': transaction.billableDays,
    'Charge reference': transaction.chargeCategoryCode,
    'Charge reference description': transaction.chargeCategoryDescription,
    'Source': transaction.source,
    'Loss': transaction.loss,
    'Volume': transaction.volume,
    'Water available Y/N': transaction.chargeElement.isRestrictedSource ? 'N' : 'Y',
    'Modelling': transaction.chargeElement.waterModel,
    'Public water supply Y/N': transaction.isWaterCompanyCharge ? 'Y' : 'N',
    'Supported source Y/N': transaction.isSupportedSource ? 'Y' : 'N',
    'Supported source name': transaction.supportedSourceName,
    'Winter discount': transaction.calcWinterDiscountFactor,
    'Canal and Rivers trust agreement': transaction.calcS130Factor,
    'Aggregate factor': transaction.aggregateFactor,
    'Charge adjustment factor': transaction.adjustmentFactor,
    'Abatement factor': transaction.calcS126Factor,
    'Two part tariff': transaction.calcS127Factor,
    'Transaction description': transaction.description,
    'Charge information reason': _changeReason(chargeVersions, transaction),
    'Is second part charge? Y/N': transaction.isTwoPartSecondPartCharge ? 'Y' : 'N',
    'Compensation charge Y/N': transaction.isCompensationCharge ? 'Y' : 'N',
    'Compensation charge applicable Y/N': invoiceLicence.licence.isWaterUndertaker ? 'N' : 'Y',
    'De minimis rule Y/N': '',
    Region: invoiceLicence.licence.region.displayName,
    'Historical area': invoiceLicence.licence.regions.historicalAreaCode,
    'EIC region': transaction.chargeElement.eiucRegion,
    'Calculated quantity': _billingVolume(transaction),
    Quantity: transaction.volume
  }

  return _rowToStrings(csvLine)
}

function _billingVolume (transaction) {
  if (!transaction.volume) {
    return null
  }

  const transactionYear = new Date(transaction.endDate).getFullYear()
  const billingVolume = transaction.billingVolume.find(row => row.financialYear === transactionYear)

  return billingVolume ? billingVolume.calculatedVolume : null
}

function _changeReason(chargeVersions, transaction) {
  const chargeVersionId = get(transaction, 'chargeElement.chargeVersionId')
  const chargeVersion = chargeVersions.find(cv => cv.id === chargeVersionId)
  return (chargeVersion && chargeVersion.changeReason)
    ? chargeVersion.changeReason.description
    : null
}

function _creditLineValue (isCredit, value) {
  if (!isCredit) {
    return null
  }

  return numberFormatter.penceToPound(value, true)
}

function _debitLineValue (isCredit, value) {
  if (isCredit) {
    return null
  }

  return numberFormatter.penceToPound(value, true)
}

function _rowToStrings (row) {
  return mapValues(row, (value) => {
    return value ? value.toString() : ''
  })
}

function _transactionLineValue (isDebit, isCredit, value) {
  if (!value) {
    return 'Error - not calculated'
  }

  if (isDebit) {
    return _debitLineValue(isCredit, value)
  }

  return _creditLineValue(isCredit, value)
}

module.exports = {
  createCSV,
  getCSVFileName
}
