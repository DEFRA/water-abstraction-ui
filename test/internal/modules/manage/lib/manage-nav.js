'use strict';
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const { getManageTabConfig } = require('internal/modules/manage/lib/manage-nav');
const { scope } = require('internal/lib/constants');

const { flatMap } = require('lodash');

const mapLinkGroup = (links, group) => links.map(link => ({
  group,
  name: link.name,
  path: link.path
}));

const getAllLinks = config => flatMap(config, mapLinkGroup);

const createRequest = (scopes = []) => {
  return {
    auth: {
      credentials: {
        scope: scopes
      }
    }
  };
};

experiment('getManageTabConfig', () => {
  experiment('when a user has no scopes', () => {
    test('none of the links are visible', async () => {
      const request = createRequest();
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([]);
    });
  });

  experiment('when user has bulk returns notifications scope', () => {
    test('they can view notification report, return invitations and return reminders notifications', async () => {
      const request = createRequest(scope.bulkReturnNotifications);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        { group: 'reports',
          name: 'Notices',
          path: '/notifications/report' },
        { group: 'returnNotifications',
          name: 'Invitations',
          path: '/returns-notifications/invitations' },
        { group: 'returnNotifications',
          name: 'Reminders',
          path: '/returns-notifications/reminders' }
      ]);
    });
  });

  experiment('when user has abstraction reform approver scope', () => {
    test('they can view Digitise! report', async () => {
      const request = createRequest(scope.abstractionReformApprover);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        { group: 'reports', name: 'Digitise!', path: '/digitise/report' }
      ]);
    });
  });

  experiment('when user has renewal notifications scope', () => {
    test('they can view notifications report and renewal notifice', async () => {
      const request = createRequest(scope.renewalNotifications);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        { group: 'reports',
          name: 'Notices',
          path: '/notifications/report' },
        { group: 'licenceNotifications',
          name: 'Renewal',
          path: 'notifications/2?start=1' }
      ]);
    });
  });

  experiment('when user has returns scope', () => {
    test('they can view notifications and returns cycles reports and send paper returns forms', async () => {
      const request = createRequest(scope.returns);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        { group: 'reports',
          name: 'Notices',
          path: '/notifications/report' },
        { group: 'reports',
          name: 'Returns cycles',
          path: '/returns-reports' },
        { group: 'returnNotifications',
          name: 'Paper forms',
          path: '/returns-notifications/forms'
        }]);
    });
  });

  experiment('when user has HoF notifications scope', () => {
    test('they can view notifications reports and all HoF notifications', async () => {
      const request = createRequest(scope.hofNotifications);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([ { group: 'reports',
        name: 'Notices',
        path: '/notifications/report' },
      { group: 'hofNotifications',
        name: 'Restriction',
        path: 'notifications/1?start=1' },
      { group: 'hofNotifications',
        name: 'Hands-off flow',
        path: 'notifications/3?start=1' },
      { group: 'hofNotifications',
        name: 'Resume',
        path: 'notifications/4?start=1' } ]);
    });
  });

  experiment('when user has manage accounts scope', () => {
    test('they can view create account link', async () => {
      const request = createRequest(scope.manageAccounts);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([{
        group: 'accounts',
        name: 'Create an internal account',
        path: '/account/create-user'
      }]);
    });
  });
});
