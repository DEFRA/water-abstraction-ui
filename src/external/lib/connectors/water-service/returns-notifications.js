const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
});
const { last } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

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
  const cycles = helpers.returns.date.createReturnCycles('2017-11-01', refDate);
  const currentCycle = last(cycles);

  return {
    status: {
      $in: ['due', 'completed', 'received']
    },
    start_date: {
      $gte: currentCycle.startDate
    },
    end_date: {
      $lte: currentCycle.endDate
    },
    licence_ref: {
      $in: licenceNumbers
    }
  };
};

/**
 * Send paper form
 * @param {Array} licenceNumbers
 * @param {String} issuer - email address
 * @return {Promise} resolves with preview data
 */
const sendPaperForms = (licenceNumbers, issuer, isPreview = false) => {
  const filter = getPaperFormFilter(licenceNumbers);
  const options = buildRequest(filter, issuer, 'send paper forms', 'pdf.return_form', !isPreview);
  return rp(options);
};

/**
 * Preview sending of paper form
 * @param {Array} licenceNumbers
 * @param {String} issuer - email address
 * @return {Promise} resolves with preview data
 */
const previewPaperForms = (licenceNumbers, issuer) => {
  return sendPaperForms(licenceNumbers, issuer, true);
};

/**
 * Gets notification config for return final reminder letter
 * @param  {String} endDate - find returns with end date matching this date
 * @param  {String} issuer  - email address of current user
 * @return {Object}         - config object
 */
const getFinalReminderConfig = (endDate, issuer) => {
  return {
    filter: {
      status: 'due',
      end_date: endDate,
      'metadata->>isCurrent': 'true'
    },
    config: {
      rolePriority: ['returns_contact', 'licence_holder'],
      prefix: 'RFRM-',
      issuer,
      messageRef: {
        default: 'returns_final_reminder'
      },
      name: 'Returns: final reminder',
      deDupe: false
    }
  };
};

/**
 * Gets request options for rp to send HTTP request and either send
 * messages or download CSV of recipient data
 * @param  {String}  endDate       - End date filter for returns
 * @param  {String}  issuer        - email address ofcurrent user
 * @param  {Boolean} [isCsv=false] - Whether preview CSV (true) or send (false)
 * @return {Object}                - rp options
 */
const getFinalReminderRequestOptions = (endDate, issuer, isPreview = false) => {
  let uri = `${process.env.WATER_URI}/returns-notifications/invite/send`;
  if (isPreview) {
    uri = `${process.env.WATER_URI}/returns-notifications/invite/preview?verbose=1`;
  }
  return {
    method: 'POST',
    uri,
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    body: getFinalReminderConfig(endDate, issuer),
    json: true
  };
};

/**
 * Sends or previews final return reminders
 * @param  {String}  endDate       - End date filter for returns
 * @param  {String}  issuer        - email address ofcurrent user
 * @param  {Boolean} [isCsv=false] - Whether preview CSV (true) or send (false)
 * @return Promise                -  resolves with HTTP response
 */
const finalReturnReminders = (endDate, issuer, isPreview) => {
  const options = getFinalReminderRequestOptions(endDate, issuer, isPreview);
  return rp(options);
};

module.exports = {
  previewPaperForms,
  sendPaperForms,
  getPaperFormFilter,
  buildRequest,
  getFinalReminderRequestOptions,
  finalReturnReminders
};
