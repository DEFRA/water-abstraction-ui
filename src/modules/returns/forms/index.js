const { singleTotalForm, singleTotalSchema } = require('./single-total');
const { basisForm, basisSchema } = require('./basis');
const { quantitiesForm, quantitiesSchema } = require('./quantities');
const { meterDetailsForm, meterDetailsSchema } = require('./meter-details');
const meterUnitsForm = require('./meter-units');
const { meterReadingsForm, meterReadingsSchema } = require('./meter-readings');
const { internalRoutingForm } = require('./internal-routing');
const { logReceiptForm, logReceiptSchema } = require('./log-receipt');
const { searchForm, searchApplyNoReturnError } = require('./search');

module.exports = {
  amountsForm: require('./amounts'),
  confirmForm: require('./confirm'),
  methodForm: require('./method'),
  singleTotalForm,
  singleTotalSchema,
  unitsForm: require('./units'),
  basisForm,
  basisSchema,
  quantitiesForm,
  quantitiesSchema,
  meterDetailsForm,
  meterDetailsSchema,
  meterUnitsForm,
  meterReadingsForm,
  meterReadingsSchema,
  internalRoutingForm,
  logReceiptForm,
  logReceiptSchema,
  searchForm,
  searchApplyNoReturnError
};
