const { setUp, tearDown } = require('../../support/setup');

/* eslint-disable no-undef */
describe('notify callback attempt', function () {
  let scheduledNotificationNotifyId;
  before(() => {
    tearDown(); // Clear the testing environment down first, make sure it's clean
    setUp('notify-mock-notification'); // Add a notification record in the backend (Fake email)

    cy.fixture('users.json').then(users => { // Load the fixtures file containing email address
      cy.getLastNotifications(Cypress.env('USER_URI'), users.notifyCallbackTestEmail).then(scheduledNotification => { // Ask the backend to return the notification that was last sent to the email that we use to set up the mock notification
        scheduledNotificationNotifyId = scheduledNotification.notify_id; // Store the notify_id of the notification record in a variable so we can validate it
      });
    });
  });

  it('checks if the notification was found', () => {
    expect(scheduledNotificationNotifyId.length).to.equal(36); // Check that the Notify ID that was retrieved is a valid GUID, which typically have 36 characters
  });

  it('calls the notify callback endpoint', () => {
    cy.simulateNotifyCallback(scheduledNotificationNotifyId); // Pretending to be the Notify Service, submit a callback to the backend, which updateds the status of the Notification to 'delivered'
    cy.wait(5000);
    cy.fixture('users.json').then(users => { // Load the fixtures again (Probably not necessary if we were storing the email in a local variable!)
      cy.getLastNotifications(Cypress.env('USER_URI'), users.notifyCallbackTestEmail).then(scheduledNotificationAfterCallback => { // Once again, grab the last notification from the service that was sent to that email address
        expect(scheduledNotificationAfterCallback.notify_status).to.equal('delivered'); // Check that it now has a status of 'Delivered'
      });
    });
  });
});
