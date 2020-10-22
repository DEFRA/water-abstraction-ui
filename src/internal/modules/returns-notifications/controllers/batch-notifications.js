'use strict';

const { last } = require('lodash');

const { handleRequest, getValues } = require('shared/lib/forms');
const { sendRemindersForm, sendRemindersSchema } = require('../forms/send-reminders');

const services = require('../../../lib/connectors/services');

/**
 * Returns view object for first page in reminders flows
 */
const getRemindersStartView = request => {
  return {
    ...request.view,
    form: sendRemindersForm(request),
    back: `/notifications`
  };
};

/**
 * First page of Return Reminders and Return Invitations flows
 * Renders a form for the user to enter licence numbers to be excluded for the selected
 * notifications
 */
const getReturnsNotificationsStart = async (request, h) => {
  const view = getRemindersStartView(request);
  return h.view('nunjucks/returns-notifications/notifications', view);
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

  return h.redirect(`/waiting/${event.id}`);
};

exports.getReturnsNotificationsStart = getReturnsNotificationsStart;
exports.postReturnsNotificationsStart = postReturnsNotificationsStart;
