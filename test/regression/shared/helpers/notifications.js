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
  return response;
};

/**
 * Gets personalisation option in last email sent
 * @param {String} email
 * @param {String} param
 * @return {Mixed}
 */
const getPersonalisation = async (baseUrl, email, param) => {
  const lastNotification = await getLastNotifications(baseUrl, email);
  const personalisation = await get(JSON.parse(lastNotification), `data[0].personalisation.${param}`);

  return personalisation;
};

exports.getPersonalisation = getPersonalisation;
