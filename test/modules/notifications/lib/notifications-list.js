'use strict';

const Lab = require('lab');
const lab = exports.lab = Lab.script();

const { expect } = require('code');

const { getNotificationsList, getReportsList } = require('../../../../src/modules/notifications/lib/notifications-list');
const { scope } = require('../../../../src/lib/constants');

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

lab.experiment('getNotificationsList', () => {
  const tasks = [{
    task_config_id: '123',
    config: {
      name: 'Test'
    }
  }];

  const options = {
    newWindow: false
  };

  lab.test('It should only return task notifications when user doesnt have returns scope', async () => {
    const request = createRequest();
    const result = getNotificationsList(tasks, request);
    expect(result).to.equal([ { name: 'Test', path: '/admin/notifications/123?start=1', options } ]);
  });

  lab.test('It should include returns task notifications when user has returns scope', async () => {
    const request = createReturnsRequest();
    const result = getNotificationsList(tasks, request);
    const names = result.map(row => row.name);
    expect(names).to.equal([
      'Test',
      'Returns: send paper forms',
      'Returns: send final reminder'
    ]);
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
    expect(paths.includes('/admin/digitise/report')).to.equal(false);
  });

  lab.test('It should include AR report link in list for AR approver scope', async () => {
    const reports = getReportsList(arApprover);
    const paths = reports.map(item => item.path);
    expect(paths.includes('/admin/digitise/report')).to.equal(true);
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
