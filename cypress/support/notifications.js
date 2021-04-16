'use strict';

/* eslint-disable no-undef */
const { get } = require('lodash');
const querystring = require('querystring');

/**
 * Gets personalisation option in last email sent
 * @param {String} email
 * @param {String} param
 * @return {Mixed}
 */
const getPersonalisation = (baseUrl, email, param) => {
  cy.log('GRABBING PERSONALISATION');
  
  const url = `${baseUrl}notifications/last?${querystring.encode({ email })}`;
  cy.log('...1...');
  cy.request('GET', url).as('response') ;
  return cy.get('@response');
  cy.get('@response').then(response => {
    cy.log('...2...');
    const lastNotification = response ? response.body.data[0] : {};
    
    const personalisation = lastNotification ? lastNotification.personalisation[param] : null;
    cy.log('...3...');
    return personalisation
  })
    
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

  const url = `${Cy.env('USER_URI')}/notify/callback`;
  return cy.request.post(url, {
    form: requestBody,
    headers: {
      authorization: `Bearer ${process.env.NOTIFY_CALLBACK_TOKEN}`
    }
  });
};

exports.getPersonalisation = getPersonalisation;
exports.simulateNotifyCallback = simulateNotifyCallback;
