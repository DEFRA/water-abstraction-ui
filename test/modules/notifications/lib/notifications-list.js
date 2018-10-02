'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { getNotificationsList } = require('../../../../src/modules/notifications/lib/notifications-list');

lab.experiment('getNotificationsList', () => {
  const tasks = [{
    task_config_id: '123',
    config: {
      name: 'Test'
    }
  }];

  const internalPermissions = {
    returns: {
      edit: false
    }
  };
  const internalEditReturnsPermissions = {
    returns: {
      edit: true
    }
  };

  lab.test('It should only return task notifications when user doesnt have returns.edit permission', async () => {
    const result = getNotificationsList(tasks, internalPermissions);
    expect(result).to.equal([ { name: 'Test', path: '/admin/notifications/123?start=1' } ]);
  });

  lab.test('It should include returns task notifications when user has returns.edit permission', async () => {
    const result = getNotificationsList(tasks, internalEditReturnsPermissions);
    expect(result).to.equal([ { name: 'Test', path: '/admin/notifications/123?start=1' },
      { name: 'Returns: send paper forms',
        path: '/admin/returns-notifications/forms' } ]);
  });
});
