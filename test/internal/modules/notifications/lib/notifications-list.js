'use strict';

const { experiment, test } = exports.lab = require('lab').script();

const { expect } = require('code');

const { getNotificationsList, getReportsList } = require('../../../../../src/internal/modules/notifications/lib/notifications-list');
const { scope } = require('../../../../../src/internal/lib/constants');

const createRequest = (scopes) => {
  return {
    auth: {
      credentials: {
        scope: scopes || scope.internal
      }
    }
  };
};

const createReturnsRequest = () => {
  return createRequest([scope.internal, scope.returns]);
};

experiment('getNotificationsList', () => {
  const tasks = [{
    task_config_id: '123',
    config: {
      name: 'Test'
    }
  }];

  const options = {
    newWindow: false
  };

  test('It should only return task notifications when user doesnt have returns scope', async () => {
    const request = createRequest();
    const result = getNotificationsList(tasks, request);
    expect(result).to.equal([ { name: 'Test', path: '/notifications/123?start=1', options } ]);
  });

  test('It should include returns task notifications when user has returns scope', async () => {
    const request = createReturnsRequest();
    const result = getNotificationsList(tasks, request);
    const names = result.map(row => row.name);
    expect(names).to.equal([
      'Test',
      'Returns: send invitations',
      'Returns: send paper forms',
      'Returns: send reminders',
      'Returns: send final reminder'
    ]);
  });
});

experiment('getReportsList', () => {
  test('It should not include AR report link for AR user scope', async () => {
    const request = createRequest(scope.abstractionReformUser);
    const reports = getReportsList(request);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/digitise/report')).to.equal(false);
  });

  test('It should include AR report link in list for AR approver scope', async () => {
    const request = createRequest(scope.abstractionReformApprover);
    const reports = getReportsList(request);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/digitise/report')).to.equal(true);
  });

  test('It includes returns overview link for returns user', async () => {
    const request = createReturnsRequest();
    const reports = getReportsList(request);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/returns-reports')).to.equal(true);
  });

  test('It does not include returns overview link for other internal users', async () => {
    const request = createRequest();
    const reports = getReportsList(request);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/returns-reports')).to.equal(false);
  });
});
