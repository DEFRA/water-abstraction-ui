const { singleTotalForm, singleTotalSchema } = require('./single-total');
const { basisForm, basisSchema } = require('./basis');

module.exports = {
  amountsForm: require('./amounts'),
  confirmForm: require('./confirm'),
  methodForm: require('./method'),
  singleTotalForm,
  singleTotalSchema,
  unitsForm: require('./units'),
  basisForm,
  basisSchema
};
