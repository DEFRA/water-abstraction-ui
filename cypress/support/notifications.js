const { get } = require('lodash');
const querystring = require('querystring');
const axios = require('axios');

Cypress.Commands.add('simulateNotifyCallback', async (notificationId) => {
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

  const url = `${Cypress.env('USER_URI')}notify/callback`;
  await axios.post(url, requestBody, {
    headers: {
      authorization: `Bearer ${Cypress.env('NOTIFY_CALLBACK_TOKEN')}`
    }
  });
  return 'OK'
});

Cypress.Commands.add('getLastNotifications', async (baseUrl, email) => {
  const url = `${baseUrl}notifications/last?${querystring.encode({ email })}`;
  const response = await axios.get(url);
  return get((response), `data.data[0]`, {});
});
