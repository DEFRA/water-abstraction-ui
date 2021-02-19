const { getLastNotifications, simulateNotifyCallback } = require('../shared/helpers/notifications');
const { sleepFor } = require('../shared/helpers/utils');
const config = require('./config');
const { setUp, tearDown } = require('../shared/helpers/setup');

/* eslint-disable no-undef */
describe('notify callback attempt', function () {
  let scheduledNotification, scheduledNotificationAfterCallback, scheduledNotificationNotifyId;
  before(async () => {
    await tearDown();
    await setUp('notify-mock-notification');
    await sleepFor(1000);
    scheduledNotification = await getLastNotifications(config.baseUrl, config.userEmails.notifyCallbackTestEmail);
    scheduledNotificationNotifyId = scheduledNotification.notify_id;
  });

  it('checks if the notification was found', () => {
    expect(scheduledNotificationNotifyId.length).toBe(36);
  });

  it('calls the notify callback endpoint', async () => {
    await simulateNotifyCallback(scheduledNotificationNotifyId);
    await sleepFor(1000);
    scheduledNotificationAfterCallback = await getLastNotifications(config.baseUrl, config.userEmails.notifyCallbackTestEmail);
    expect(scheduledNotificationAfterCallback.notify_status).toBe('delivered');
  });
});
