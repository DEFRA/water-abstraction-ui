const ServiceClient = require('shared/lib/connectors/services/ServiceClient');
const { last } = require('lodash');
const helpers = require('@envage/water-abstraction-helpers');

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

class ReturnsNotificationsService extends ServiceClient {
  /**
   * Creates the filter that will be used for sending paper forms
   * @param {Array} licenceNumbers
   * @param {String} refDate - reference date, for unit testing.  Defaults to today
   * @return {Object} filter
   */
  getPaperFormFilter (licenceNumbers, refDate) {
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
  }

  /**
   * Send paper form
   * @param {Array} licenceNumbers
   * @param {String} issuer - email address
   * @return {Promise} resolves with preview data
   */
  sendPaperForms (licenceNumbers, issuer, isPreview = false) {
    const url = this.joinUrl('returns-notifications', isPreview ? 'preview' : 'send', 'pdf.return_form');
    return this.serviceRequest.post(url, {
      body: {
        filter: this.getPaperFormFilter(licenceNumbers),
        issuer,
        name: 'send paper forms'
      }
    });
  }

  /**
   * Preview sending of paper form
   * @param {Array} licenceNumbers
   * @param {String} issuer - email address
   * @return {Promise} resolves with preview data
   */
  previewPaperForms (licenceNumbers, issuer) {
    return this.sendPaperForms(licenceNumbers, issuer, true);
  }

  /**
   * Sends or previews final return reminders
   * @param  {String}  endDate       - End date filter for returns
   * @param  {String}  issuer        - email address ofcurrent user
   * @param  {Boolean} [isCsv=false] - Whether preview CSV (true) or send (false)
   * @return Promise                -  resolves with HTTP response
   */
  finalReturnReminders (endDate, issuer, isPreview) {
    const tail = isPreview ? 'preview?verbose=1' : 'send';
    const url = this.joinUrl('returns-notifications/invite', tail);
    return this.serviceRequest.post(url, {
      body: getFinalReminderConfig(endDate, issuer)
    });
  };
}

module.exports = ReturnsNotificationsService;
