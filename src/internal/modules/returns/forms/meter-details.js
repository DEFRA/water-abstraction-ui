const Joi = require('@hapi/joi');
const { get } = require('lodash');
const { formFactory, setValues } = require('shared/lib/forms');
const { getMeter } = require('shared/modules/returns/forms/common');

const { getContinueField, getCsrfTokenField, getHeadingField } =
 require('shared/modules/returns/forms/common');
const { getTextField, getMultiplierField } =
  require('shared/modules/returns/forms/meter-details');

const getHintText = isVolumes => {
  return isVolumes
    ? 'This will not recalculate any of the volumes provided'
    : 'This will affect calculated volumes based on your readings';
};

const form = (request, data) => {
  const isVolumes = get(data, 'reading.method') === 'abstractionVolumes';
  const meter = getMeter(data);

  // Checkbox internal type is array
  const checked = meter.multiplier === 10 ? ['multiply'] : [];

  const f = {
    ...formFactory(),
    fields: [
      getHeadingField('Meter details'),
      getTextField('manufacturer', 'Make', 'Enter the make of the meter', true),
      getTextField('serialNumber', 'Serial number', 'Enter a serial number'),
      getMultiplierField('Has a ×10 display', getHintText(isVolumes), checked),
      getCsrfTokenField(request),
      getContinueField()
    ]
  };

  return setValues(f, meter);
};

/**
 * Gets Joi the schema for the meter details form
 * @param {Object} data - return data model
 * @return {Object} Joi schema
 */
const meterDetailsSchema = (data) => {
  const schema = {
    manufacturer: Joi.string().required(),
    serialNumber: Joi.string().required(),
    isMultiplier: Joi.array().items(Joi.string().valid('multiply')),
    csrf_token: Joi.string().guid().required()
  };

  return schema;
};

module.exports = {
  form,
  schema: meterDetailsSchema
};
