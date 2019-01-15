'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { getNotificationsList, getReportsList } = require('../../../../src/modules/notifications/lib/notifications-list');

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

  const options = {
    newWindow: false
  };

  lab.test('It should only return task notifications when user doesnt have returns.edit permission', async () => {
    const result = getNotificationsList(tasks, internalPermissions);
    expect(result).to.equal([ { name: 'Test', path: '/admin/notifications/123?start=1', options } ]);
  });

  lab.test('It should include returns task notifications when user has returns.edit permission', async () => {
    const result = getNotificationsList(tasks, internalEditReturnsPermissions);
    expect(result).to.equal([
      { name: 'Test', path: '/admin/notifications/123?start=1', options },
      { name: 'Returns: send paper forms',
        path: '/admin/returns-notifications/forms',
        options } ]);
  });
});

lab.experiment('getReportsList', () => {
  const arUser = {
    ar: {
      edit: true,
      approve: false
    },
    returns: {
      edit: false
    }
  };

  const arApprover = {
    ar: {
      edit: true,
      approve: true
    },
    returns: {
      edit: false
    }
  };

  const returns = {
    ar: {
      edit: false,
      approve: false
    },
    returns: {
      edit: true
    }
  };

  lab.test('It should not include AR report link for AR user scope', async () => {
    const reports = getReportsList(arUser);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/admin/abstraction-reform/report')).to.equal(false);
  });

  lab.test('It should include AR report link in list for AR approver scope', async () => {
    const reports = getReportsList(arApprover);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/admin/abstraction-reform/report')).to.equal(true);
  });

  lab.test('It includes returns overview link when returns.edit permission is set', async () => {
    const reports = getReportsList(returns);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/admin/returns-reports')).to.equal(true);
  });

  lab.test('It does not include returns overview link when returns.edit permission is false', async () => {
    const reports = getReportsList(arUser);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/admin/returns-reports')).to.equal(false);
  });
});
