'use strict';

/* eslint-disable no-undef */
const { get } = require('lodash');
const querystring = require('querystring');
const request = require('request-promise-native');

/**
 * Gets the data for the last notification sent to the supplied email address
 * @param {String} email
 * @return {Object}
 */
const getLastNotifications = async (baseUrl, email) => {
  const url = `${baseUrl}/notifications/last?${querystring.encode({ email })}`;
  const response = await request.get(url);
  return get(JSON.parse(response), `data[0]`, {});
};

/**
 * Gets personalisation option in last email sent
 * @param {String} email
 * @param {String} param
 * @return {Mixed}
 */
const getPersonalisation = async (baseUrl, email, param) => {
  const lastNotification = await getLastNotifications(baseUrl, email);
  const personalisation = await get(lastNotification, `personalisation.${param}`);

  const parsedPersonalisation = personalisation.replace((/^https?:\/\/[^/]+/g).exec(personalisation), baseUrl);

  return parsedPersonalisation;
};

/**
 * Calls the Notify callback endpoint, to simulate a response from Notify
 */
const simulateNotifyCallback = async (notificationId) => {
  const requestBody = {
    id: notificationId,
    reference: notificationId,
    status: 'delivered',
    notification_type: 'email',
    to: 'irrelevant',
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
    sent_at: new Date().toISOString()
  };
  const { baseUrl: frontendBaseUrl } = require('../../external/config');
  const url = `${frontendBaseUrl}/notify/callback`;
  return request.post(url, {
    form: requestBody,
    headers: {
      authorization: `Bearer ${process.env.NOTIFY_CALLBACK_TOKEN}`
    }
  });
};

exports.getLastNotifications = getLastNotifications;
exports.getPersonalisation = getPersonalisation;
exports.simulateNotifyCallback = simulateNotifyCallback;
