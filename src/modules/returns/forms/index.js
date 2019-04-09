const { singleTotalForm, singleTotalSchema } = require('./single-total');
const { quantitiesForm, quantitiesSchema } = require('./quantities');
const { meterDetailsForm, meterDetailsSchema } = require('./meter-details');
const meterUnitsForm = require('./meter-units');
const { meterReadingsForm, meterReadingsSchema } = require('./meter-readings');
const { internalRoutingForm } = require('./internal-routing');
const { internalMethodForm } = require('./internal-method');
const { logReceiptForm, logReceiptSchema } = require('./log-receipt');
const { meterDetailsProvidedForm } = require('./meter-details-provided');
const {
  singleTotalAbstractionPeriodForm,
  singleTotalAbstractionPeriodSchema
} = require('./single-total-abstraction-period');
const { returnReceivedForm } = require('./return-received');
const { meterUsedForm, meterUsedSchema } = require('./meter-used');

module.exports = {
  amountsForm: require('./amounts'),
  confirmForm: require('./confirm'),
  methodForm: require('./method'),
  internalMethodForm,
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
  logReceiptSchema,
  meterDetailsProvidedForm,
  singleTotalAbstractionPeriodForm,
  singleTotalAbstractionPeriodSchema,
  returnReceivedForm,
  meterUsedForm,
  meterUsedSchema
};
