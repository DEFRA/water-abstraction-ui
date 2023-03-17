'use strict'

const { setUp, tearDown } = require('../../support/setup')

describe('notify callback attempt', function () {
  before(() => {
    tearDown() // Clear the testing environment down first, make sure it's clean
    setUp('notify-mock-notification') // Add a notification record in the backend (Fake email)
  })

  it('checks if the notification was found', () => {
    cy.fixture('users.json').then(users => {
      cy.getLastNotifications(Cypress.env('ADMIN_URI'), users.notifyCallbackTestEmail).then((notification) => {
        // Check that the Notify ID that was retrieved is a valid GUID, which typically have 36 characters
        expect(notification.notify_id.length).to.equal(36)
      })
    })
  })

  it('calls the notify callback endpoint', () => {
    // Pretending to be the Notify Service, submit a callback to the backend, which updateds the status of the Notification to 'delivered'
    cy.simulateNotifyCallback('82fda2b8-0a53-4f02-bcaa-1e13949b250b')
      .its('status', { log: false }).should('equal', 204)

    cy.wait(5000)

    cy.fixture('users.json').then(users => {
      cy.getLastNotifications(Cypress.env('ADMIN_URI'), users.notifyCallbackTestEmail).then((notification) => {
        // Check that it now has a status of 'Delivered'
        expect(notification.notify_status).to.equal('delivered')
      })
    })
  })
})
