const { singleTotalForm, singleTotalSchema } = require('./single-total');
const { quantitiesForm, quantitiesSchema } = require('./quantities');
const { meterDetailsForm, meterDetailsSchema } = require('./meter-details');
const meterUnitsForm = require('./meter-units');
const { meterReadingsForm, meterReadingsSchema } = require('./meter-readings');
const { internalRoutingForm } = require('./internal-routing');
const { logReceiptForm, logReceiptSchema } = require('./log-receipt');

module.exports = {
  amountsForm: require('./amounts'),
  confirmForm: require('./confirm'),
  methodForm: require('./method'),
  singleTotalForm,
  singleTotalSchema,
  unitsForm: require('./units'),
  quantitiesForm,
  quantitiesSchema,
  meterDetailsForm,
  meterDetailsSchema,
  meterUnitsForm,
  meterReadingsForm,
  meterReadingsSchema,
  meterResetForm: require('./meter-reset'),
  internalRoutingForm,
  logReceiptForm,
  logReceiptSchema
};
