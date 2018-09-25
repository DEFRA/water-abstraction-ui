const moment = require('moment');
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});

/**
 * Calls the returns notifications API and either previews or sends a message
 * @param {Object} filter - a filter to select the returns the message will target
 * @param {String} issuer - email address of user sending message
 * @param {String} name - Friendly name of notification, displays in log
 * @param {String} messageRef - message ref / template name
 * @param {Boolean} isSending - whether preview or send mode
 * @return {Promise} resolves with data
 */
const buildRequest = (filter, issuer, name, messageRef, isSending = false) => {
  const endpoint = `${process.env.WATER_URI}/returns-notifications`;
  const uri = `${endpoint}${isSending ? '/send' : '/preview'}/${messageRef}`;

  return {
    method: 'POST',
    uri,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body: {
      filter,
      issuer,
      name
    },
    json: true
  };
};

/**
 * Creates the filter that will be used for sending paper forms
 * @param {Array} licenceNumbers
 * @param {String} refDate - reference date, for unit testing.  Defaults to today
 * @return {Object} filter
 */
const getPaperFormFilter = (licenceNumbers, refDate) => {
  const minEndDate = moment(refDate).subtract(1, 'years').format('YYYY-MM-DD');
  return {
    status: 'due',
    end_date: {
      $gt: minEndDate
    },
    licence_ref: {
      $in: licenceNumbers
    },
    'metadata->>isCurrent': 'true'
  };
};

/**
 * Preview sending of paper form
 * @param {Array} licenceNumbers
 * @param {String} issuer - email address
 * @return {Promise} resolves with preview data
 */
const previewPaperForms = (licenceNumbers, issuer) => {
  const filter = getPaperFormFilter(licenceNumbers);
  const options = buildRequest(filter, issuer, 'send paper forms', 'pdf.return_form', false);
  return rp(options);
};

/**
 * Send paper form
 * @param {Array} licenceNumbers
 * @param {String} issuer - email address
 * @return {Promise} resolves with preview data
 */
const sendPaperForms = (licenceNumbers, issuer) => {
  const filter = getPaperFormFilter(licenceNumbers);
  const options = buildRequest(filter, issuer, 'send paper forms', 'pdf.return_form', true);
  return rp(options);
};

module.exports = {
  previewPaperForms,
  sendPaperForms,
  getPaperFormFilter,
  buildRequest
};
