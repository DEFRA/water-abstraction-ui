'use strict'

const moment = require('moment')
const numberFormatter = require('../../../../shared/lib/number-formatter')
const { mapValues, isNull, sortBy, get } = require('lodash')
const mappers = require('../lib/mappers')

const isNullOrUndefined = value => isNull(value) || value === undefined
const valueToString = value => isNullOrUndefined(value) ? '' : value.toString()
const rowToStrings = row => mapValues(row, valueToString)

const getAbsStartAndEnd = absPeriod => ({
  'Abstraction period start date': moment().month(absPeriod.startMonth - 1).date(absPeriod.startDay).format('D MMM'),
  'Abstraction period end date': moment().month(absPeriod.endMonth - 1).date(absPeriod.endDay).format('D MMM')
})

const getChargeElementData = trans => {
  if (trans.chargeType === 'minimum_charge') return {}
  return {
    'Standard Unit Charge (SUC) (£/1000 cubic metres)': trans.calcSucFactor,
    'Environmental Improvement Unit Charge (EIUC) (£/1000 cubic metres)': trans.calcEiucFactor,
    'Authorised annual quantity (megalitres)': trans.chargeElement.authorisedAnnualQuantity,
    'Billable annual quantity (megalitres)': trans.chargeElement.billableAnnualQuantity,
    'Source type': trans.chargeElement.source,
    'Source factor': trans.calcSourceFactor,
    'Adjusted source type': trans.chargeElement.source === 'tidal' ? 'tidal' : 'other',
    'Adjusted source factor': trans.calcEiucSourceFactor,
    Season: trans.chargeElement.season,
    'Season factor': trans.calcSeasonFactor,
    Loss: trans.chargeElement.loss,
    'Loss factor': trans.calcLossFactor,
    'Purpose code': trans.chargeElement.purposeUse.legacyId,
    'Purpose name': trans.chargeElement.purposeUse.description,
    ...getAbsStartAndEnd(trans.abstractionPeriod)
  }
}

const getBillingVolume = trans => {
  const transactionYear = new Date(trans.endDate).getFullYear()
  const billingVolume = trans.billingVolume.find(row => row.financialYear === transactionYear)
  return billingVolume ? billingVolume.calculatedVolume : null
}

const _getTransactionData = trans => ({
  description: trans.description,
  'Compensation charge Y/N': trans.isCompensationCharge ? 'Y' : 'N',
  ...getChargeElementData(trans),
  'Charge period start date': trans.startDate,
  'Charge period end date': trans.endDate,
  'Authorised days': trans.authorisedDays,
  'Billable days': trans.billableDays,
  'Calculated quantity': trans.volume ? getBillingVolume(trans) : null,
  Quantity: trans.volume,
  'S127 agreement (Y/N)': trans.section127Agreement ? 'Y' : 'N',
  'S127 agreement value': trans.calcS127Factor || null,
  'S130 agreement': trans.section130Agreement,
  'S130 agreement value': null
})

const _getInvoiceAccountData = invoiceAccount => ({
  'Billing account number': invoiceAccount.invoiceAccountNumber,
  'Customer name': invoiceAccount.company.name
})

const getDebitCreditLines = (value, isCredit, debitLabel, creditLabel) => {
  const formattedValue = numberFormatter.penceToPound(value, true)
  if (isCredit) {
    return {
      [debitLabel]: null,
      [creditLabel]: formattedValue
    }
  }
  return {
    [debitLabel]: formattedValue,
    [creditLabel]: null
  }
}

const _getInvoiceData = invoice => {
  const { netAmount, isCredit } = invoice
  return {
    'Bill number': invoice.invoiceNumber,
    'Financial year': invoice.financialYearEnding,
    ...getDebitCreditLines(netAmount, isCredit, 'Invoice amount', 'Credit amount')
  }
}

const _getTransactionAmounts = trans => {
  const { netAmount, isCredit } = trans

  if (isNull(netAmount)) {
    return {
      'Net transaction line amount(debit)': 'Error - not calculated',
      'Net transaction line amount(credit)': 'Error - not calculated'
    }
  }
  return getDebitCreditLines(netAmount, isCredit, 'Net transaction line amount(debit)', 'Net transaction line amount(credit)')
}

const getChangeReason = (chargeVersions, transaction) => {
  const chargeVersionId = get(transaction, 'chargeElement.chargeVersionId')
  const chargeVersion = chargeVersions.find(cv => cv.id === chargeVersionId)
  return (chargeVersion && chargeVersion.changeReason)
    ? chargeVersion.changeReason.description
    : null
}

const createCSV = async (invoices, chargeVersions) => {
  const sortedInvoices = sortBy(invoices, 'invoiceAccountaNumber', 'billingInvoiceLicences[0].licence.licenceRef')
  return sortedInvoices.reduce((dataForCSV, invoice) => {
    invoice.billingInvoiceLicences.forEach(invLic => {
      const { isDeMinimis } = invoice
      invLic.billingTransactions.forEach(trans => {
        const { description, ...transactionData } = _getTransactionData(trans)
        const csvLine = {
          ..._getInvoiceAccountData(invoice.invoiceAccount),
          'Licence number': invLic.licenceRef,
          ..._getInvoiceData(invoice),
          ..._getTransactionAmounts(trans),
          'Charge information reason': getChangeReason(chargeVersions, trans),
          Region: invLic.licence.region.displayName,
          'De minimis rule Y/N': isDeMinimis ? 'Y' : 'N',
          'Transaction description': description,
          'Water company Y/N': invLic.licence.isWaterUndertaker ? 'Y' : 'N',
          'Historical area': invLic.licence.regions.historicalAreaCode,
          ...transactionData
        }
        dataForCSV.push(rowToStrings(csvLine))
      })
    })
    return dataForCSV
  }, [])
}

const getCSVFileName = batch => {
  const batchType = mappers.mapBatchType(batch.type)
  return `${batch.region.displayName} ${batchType.toLowerCase()} bill run ${batch.billRunNumber}.csv`
}

module.exports = {
  _getInvoiceData,
  _getInvoiceAccountData,
  _getTransactionData,
  _getTransactionAmounts,
  createCSV,
  getCSVFileName
}
