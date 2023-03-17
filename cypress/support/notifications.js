'use strict'

const querystring = require('querystring')

Cypress.Commands.add('simulateNotifyCallback', (notificationId) => {
  cy.request({
    url: `${Cypress.env('USER_URI')}notify/callback`,
    log: false,
    method: 'POST',
    headers: {
      authorization: `Bearer ${Cypress.env('NOTIFY_CALLBACK_TOKEN')}`
    },
    body: {
      id: notificationId,
      reference: notificationId,
      status: 'delivered',
      notification_type: 'email',
      to: 'irrelevant',
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      sent_at: new Date().toISOString()
    },
    timeout: 60000
  })
});

Cypress.Commands.add('getLastNotifications', (baseUrl, email) => {
  cy.request({
    url: `${baseUrl}notifications/last?${querystring.encode({ email })}`,
    log: false,
    method: 'GET'
  }).then((response) => {
    return cy.wrap(response.body.data[0])
  })
})
