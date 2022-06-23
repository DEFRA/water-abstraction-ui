'use strict'

const billRunRoutes = require('./routes/bill-run')
const createBillRun = require('./routes/create-bill-run')
const invoiceLicences = require('./routes/invoice-licences')
const twoPartTariff = require('./routes/two-part-tariff')

module.exports = [
  ...Object.values(billRunRoutes),
  ...Object.values(createBillRun),
  ...Object.values(invoiceLicences),
  ...Object.values(twoPartTariff)
]
