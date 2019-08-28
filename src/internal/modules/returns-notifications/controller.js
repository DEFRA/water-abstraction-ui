const moment = require('moment');
const Boom = require('@hapi/boom');
const { reduce, pick, uniqBy, difference, last } = require('lodash');

const { handleRequest, getValues, setValues } = require('shared/lib/forms');
const { csvDownload } = require('../../lib/csv-download');
const licenceNumbersForm = require('./forms/licence-numbers');
const confirmLicenceNumbersForm = require('./forms/licence-numbers-confirm');
const { schema } = require('./forms/licence-numbers');
const { sendFinalRemindersForm } = require('./forms/send-final-reminders');
const { sendRemindersForm, sendRemindersSchema } = require('./forms/send-reminders');

const services = require('../../lib/connectors/services');

const { getFinalReminderConfig } = require('./lib/helpers');

/**
 * Renders a page for the user to input a list of licences to whom
 * they wish to send return forms
 */
const getSendForms = async (request, h) => {
  return h.view('water/returns-notifications/forms', {
    ...request.view,
    form: licenceNumbersForm(request)
  });
};

const isValidDateBeforeNow = val => {
  const date = moment(val, 'YYYYMMDD');
  return date.isValid() && date.isSameOrBefore(moment());
};

/**
 * Takes the return data object that has the licence end date properties
 * and adds comma separated string for any of the end dates that are set
 * to dates in the past.
 *
 * e.g.
 * { licence_ref: '12', dateRevoked: null, dateExpired: 'a date', dateLapsed: 'a date' }
 *
 * will be augmented with an value 'Expired, Lapsed'
 *
 * {
 *  licence_ref: '12',
 *  dateRevoked: null, dateExpired: 'a date', dateLapsed: 'a date',
 *  endedReasons: 'Expired, Lapsed'
 * }
 */
const addEndedReasonList = returnData => {
  const ret = pick(returnData, 'dateRevoked', 'dateExpired', 'dateLapsed');

  const reasons = reduce(ret, (acc, val, key) => {
    return isValidDateBeforeNow(val) ? [...acc, key.replace('date', '')] : acc;
  }, []);

  returnData.endedReasons = reasons.join(', ');
  return returnData;
};

const getUniqueLicences = returns => {
  const uniqueLicences = uniqBy(returns, 'licence_ref');
  return uniqueLicences.map(addEndedReasonList);
};

/**
 * Previews the licences that notifications will be sent to as
 * part of the notification
 * @param {String} request.payload.licenceNumbers - list of licence numbers with common separators
 * @param {String} request.payload.csrf_token
 */
const postPreviewRecipients = async (request, h) => {
  const form = handleRequest(licenceNumbersForm(request), request, schema);

  if (form.isValid) {
    const { licenceNumbers } = getValues(form);
    const { userName: emailAddress } = request.defra;

    // Preview sending of paper forms.  This checks whether due returns exist
    // for the requested licence numbers
    const result = await services.water.returnsNotifications.previewPaperForms(licenceNumbers, emailAddress);

    if (result.error) {
      throw Boom.badImplementation(`Error previewing returns paper forms`, result.error);
    }

    const uniqueLicences = getUniqueLicences(result.data);
    const uniqueLicenceNumbers = uniqueLicences.map(l => l.licence_ref);

    const confirmForm = setValues(confirmLicenceNumbersForm(request), {
      licenceNumbers: uniqueLicenceNumbers
    });

    return h.view('water/returns-notifications/forms-confirm', {
      ...request.view,
      form: confirmForm,
      uniqueLicences,
      notMatched: difference(licenceNumbers, uniqueLicenceNumbers)
    });
  } else {
    return h.view('water/returns-notifications/forms', {
      ...request.view,
      form
    });
  }
};

/**
 * Queues the messages for sending
 * @param {String} request.payload.licenceNumbers - list of licence numbers with common separators
 * @param {String} request.payload.csrf_token
 */
const postSendForms = async (request, h) => {
  const form = handleRequest(confirmLicenceNumbersForm(request), request, schema);

  if (form.isValid) {
    const { licenceNumbers } = getValues(form);
    const { userName: emailAddress } = request.defra;

    // Preview sending of paper forms.  This checks whether due returns exist
    // for the requested licence numbers
    const result = await services.water.returnsNotifications.sendPaperForms(licenceNumbers, emailAddress);

    if (result.error) {
      throw Boom.badImplementation(`Error previewing returns paper forms`, result.error);
    }

    return h.redirect('/returns-notifications/forms-success');
  }

  return postPreviewRecipients(request, h);
};

/**
 * Success page for when flow completed
 */
const getSendFormsSuccess = (request, h) => {
  return h.view('water/returns-notifications/forms-success', {
    ...request.view
  });
};

/**
 * Returns view object for first page in reminders flows
 */
const getRemindersStartView = (request, isFinalReminder = false) => {
  return {
    ...request.view,
    form: isFinalReminder ? sendFinalRemindersForm(request) : sendRemindersForm(request),
    back: `/notifications`
  };
};

/**
 * Renders a form so that the user can send a final returns reminder letter
 * We need a form to protect against CSRF
 */
const getFinalReminder = async (request, h) => {
  const view = getRemindersStartView(request, true);
  const options = { layout: false };
  return h.view('nunjucks/returns-notifications/final-reminder.njk', view, options);
};

/**
 * Downloads CSV data to show who will receive final return reminders
 */
const getFinalReminderCSV = async (request, h) => {
  const { email, endDate } = getFinalReminderConfig(request);
  const { messages } = await services.water.returnsNotifications.finalReturnReminders(endDate, email, true);
  const data = messages.map(row => row.personalisation);
  return csvDownload(h, data, `final-reminders-${endDate}.csv`);
};

/**
 * Sends final return reminders via Notify and display confirmation message
 */
const postSendFinalReminder = async (request, h) => {
  const { email, endDate } = getFinalReminderConfig(request);
  const { event } = await services.water.returnsNotifications.finalReturnReminders(endDate, email, false);
  const view = {
    ...request.view,
    event
  };

  return h.view('nunjucks/batch-notifications/confirmation.njk', view, { layout: false });
};
/**
 * First page of Return Reminders and Return Invitations flows
 * Renders a form for the user to enter licence numbers to be excluded for the selected
 * notifications
 */
const getReturnsNotificationsStart = async (request, h) => {
  const view = getRemindersStartView(request);
  const options = { layout: false };
  return h.view('nunjucks/returns-notifications/notifications.njk', view, options);
};
/**
 * Returns the relevant batch notifications connector based on the current path
 */
const getBatchNotificationsConnector = path => {
  const messageType = last(path.split('/'));
  const connectors = {
    reminders: services.water.batchNotifications.prepareReturnsReminders,
    invitations: services.water.batchNotifications.prepareReturnsInvitations
  };
  return connectors[messageType].bind(services.water.batchNotifications);
};
/**
 * Calls the relevant API point with issuer and licences data
 * Returning event data
 */
const getNotificationsData = async request => {
  const form = handleRequest(sendRemindersForm(request), request, sendRemindersSchema);

  const { excludeLicences } = getValues(form);
  const { userName: issuer } = request.defra;

  const connector = getBatchNotificationsConnector(request.path);

  return connector(issuer, excludeLicences);
};
/**
 * Sends licences to exclude and calls the relevant API point in the water service
 * to prepare the requested notifications
 */
const postReturnsNotificationsStart = async (request, h) => {
  // get the event id from the water service and redirect
  const { data: event } = await getNotificationsData(request);

  return h.redirect(`/waiting/${event.eventId}`);
};

exports.getSendForms = getSendForms;
exports.postPreviewRecipients = postPreviewRecipients;
exports.postSendForms = postSendForms;
exports.getSendFormsSuccess = getSendFormsSuccess;
exports.getFinalReminder = getFinalReminder;
exports.getFinalReminderCSV = getFinalReminderCSV;
exports.postSendFinalReminder = postSendFinalReminder;

exports.getReturnsNotificationsStart = getReturnsNotificationsStart;
exports.postReturnsNotificationsStart = postReturnsNotificationsStart;
