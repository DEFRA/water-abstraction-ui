const util = require('util');
const csvStringify = util.promisify(require('csv-stringify'));

/**
 * Provides a convenient way to download a CSV file
 * @param  {Object} h        - HAPI response toolkit
 * @param  {Array} data      - Array of objects representing table data
 * @param  {String} filename - the filename to download
 * @return {Promise}         resolves with HAPI response
 */
const csvDownload = async (h, data, filename = 'download.csv', opts = {}) => {
  const options = Object.assign({ header: true }, opts);
  const str = await csvStringify(data, options);
  return h.response(str)
    .header('Content-type', 'text/csv')
    .header('Content-disposition', `attachment; filename="${filename}"`);
};

module.exports = {
  csvDownload
};
