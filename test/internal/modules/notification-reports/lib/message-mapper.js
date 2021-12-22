const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { mapResponseToView } = require('internal/modules/notifications-reports/lib/message-mapper');
const { scope } = require('internal/lib/constants');

experiment('mapResponseToView', () => {
  const request = {
    query: {
      page: 1,
      filter: '',
      sentBy: ''
    },
    auth: {
      credentials: {
        scope: scope.allNotifications
      }
    }
  };
  const notificationCategories = [
    {
      value: 'Water Abstraction Alert Reduce Warning',
      label: 'water_abstraction_alert_reduce_warning'
    },
    {
      value: 'testvalue',
      label: 'testlabel'
    }];
  const response = {};
  test('without notificationCategories works', async () => {
    const result = mapResponseToView(response, request);
    expect(result.checkBoxItems.length).to.equal(0);
  });

  test('notificationCategories should be passed through if present', async () => {
    const result = mapResponseToView(response, request, notificationCategories);
    const expected = {
      filter: '',
      sentBy: '',
      checkBoxItems: [
        {
          value: 'Water Abstraction Alert Reduce Warning',
          text: 'water_abstraction_alert_reduce_warning',
          checked: false
        },
        {
          value: 'testvalue',
          text: 'testlabel',
          checked: false
        }
      ] };

    expect(result.checkBoxItems.length).to.equal(expected.checkBoxItems.length);
    expect(result.checkBoxItems[0].value).to.equal(expected.checkBoxItems[0].value);
  });
});
