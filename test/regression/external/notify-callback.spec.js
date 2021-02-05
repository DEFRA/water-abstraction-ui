const { getLastNotifications, simulateNotifyCallback } = require('../shared/helpers/notifications');
const config = require('./config');

/* eslint-disable no-undef */
describe('notify callback attempt', function () {
  let scheduledNotification, scheduledNotificationAfterCallback, scheduledNotificationId;
  before(async () => {
    scheduledNotification = await getLastNotifications(config.baseUrl, config.userEmails.notifyCallbackTestEmail);
    scheduledNotificationId = JSON.parse(scheduledNotification).data[0].id;
  });

  it('checks if the notification was found', () => {
    expect(scheduledNotificationId.length).toBe(36);
  });

  it('calls the notify callback endpoint', async () => {
    await simulateNotifyCallback(scheduledNotificationId);
    await new Promise(sitTight => setTimeout(sitTight, 2000));
    scheduledNotificationAfterCallback = await getLastNotifications(config.baseUrl, config.userEmails.notifyCallbackTestEmail);
    expect(JSON.parse(scheduledNotificationAfterCallback).data[0].notify_status).toBe('delivered');
  });
});
