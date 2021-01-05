'use strict';

/* eslint-disable no-undef */
const { get } = require('lodash');
const querystring = require('querystring');
const request = require('request');

/**
 * Gets the data for the last notification sent to the supplied email address
 * @param {String} email
 * @return {Object}
 */
const getLastNotifications = (baseUrl, email, callback) => {
  const url = `${baseUrl}/notifications/last?${querystring.encode({ email })}`;
  request.get(url, function (err, resp, body) {
    if (err) {
      return callback(err, null);
    }
    callback(null, JSON.parse(body));
  });
};

/**
 * Gets personalisation option in last email sent
 * @param {String} email
 * @param {String} param
 * @return {Mixed}
 */
const getPersonalisation = (baseUrl, email, param) => {
  getLastNotifications(baseUrl, email, function (err, body) {
    if (err) {
      throw err;
    }
    return get(body, `data[0].personalisation.${param}`);
  });
};

exports.getPersonalisation = getPersonalisation;
