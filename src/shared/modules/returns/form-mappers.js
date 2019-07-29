
/**
 * Given an object of key/value pairs from meters/readings forms,
 * maps to an array of items with { startDate, endDate, [valueKey]}
 * @param  {Object} data                  - form data
 * @param  {String} [valueKey='quantity'] - the key to use for the value field
 * @return {Array}                        - return line array
 */
const mapLines = (data, valueKey = 'quantity') => {
  return Object.keys(data).map(key => {
    const [startDate, endDate] = key.split('_');
    return { startDate, endDate, [valueKey]: data[key] };
  });
};

/**
 * gets meter details object from form data
 * @param  {Object} data - form data
 * @return {Object}      - meter details data
 */
const mapMeterDetails = data => {
  const { isMultiplier, manufacturer, serialNumber } = data;
  const multiplier = (isMultiplier || []).includes('multiply') ? 10 : 1;
  return { manufacturer, serialNumber, multiplier };
};

exports.mapLines = mapLines;
exports.mapMeterDetails = mapMeterDetails;
