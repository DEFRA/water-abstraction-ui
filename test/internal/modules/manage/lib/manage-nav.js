'use strict';
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const { getManageTabConfig } = require('internal/modules/manage/lib/manage-nav');
const { scope } = require('internal/lib/constants');

const { flatMap } = require('lodash');
const config = require('internal/config');
const sinon = require('sinon');

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

const sandbox = sinon.createSandbox();

experiment('getManageTabConfig', () => {
  afterEach(() => {
    sandbox.restore();
  });

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
        {
          group: 'reports',
          name: 'Notices',
          path: '/notifications/report'
        },
        {
          group: 'reports',
          name: 'Key performance indicators',
          path: '/reporting/kpi-reporting'
        },
        {
          group: 'returnNotifications',
          name: 'Invitations',
          path: '/returns-notifications/invitations'
        },
        {
          group: 'returnNotifications',
          name: 'Reminders',
          path: '/returns-notifications/reminders'
        }
      ]);
    });
  });

  experiment('when user has abstraction reform approver scope', () => {
    test('they can view Digitise! report', async () => {
      const request = createRequest(scope.abstractionReformApprover);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        { group: 'reports', name: 'Digitise!', path: '/digitise/report' },
        { group: 'reports', name: 'Key performance indicators', path: '/reporting/kpi-reporting' }
      ]);
    });
  });

  experiment('when user has renewal notifications scope', () => {
    test('they can view notifications report and renewal notifice', async () => {
      const request = createRequest(scope.renewalNotifications);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        {
          group: 'reports',
          name: 'Notices',
          path: '/notifications/report'
        },
        {
          group: 'reports',
          name: 'Key performance indicators',
          path: '/reporting/kpi-reporting'
        },
        {
          group: 'licenceNotifications',
          name: 'Renewal',
          path: 'notifications/2?start=1'
        }
      ]);
    });
  });

  experiment('when user has returns scope', () => {
    test('they can view notifications and returns cycles reports and send paper returns forms', async () => {
      const request = createRequest(scope.returns);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        {
          group: 'reports',
          name: 'Notices',
          path: '/notifications/report'
        },
        {
          group: 'reports',
          name: 'Returns cycles',
          path: '/returns-reports'
        },
        {
          group: 'reports',
          name: 'Key performance indicators',
          path: '/reporting/kpi-reporting'
        },
        {
          group: 'returnNotifications',
          name: 'Paper forms',
          path: '/returns-notifications/forms'
        }]);
    });
  });

  experiment('when user has HoF notifications scope', () => {
    test('they can view notifications reports and all HoF notifications', async () => {
      const request = createRequest(scope.hofNotifications);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([{
        group: 'reports',
        name: 'Notices',
        path: '/notifications/report'
      },
      {
        group: 'reports',
        name: 'Key performance indicators',
        path: '/reporting/kpi-reporting'
      },
      {
        group: 'hofNotifications',
        name: 'Restriction',
        path: 'notifications/1?start=1'
      },
      {
        group: 'hofNotifications',
        name: 'Hands-off flow',
        path: 'notifications/3?start=1'
      },
      {
        group: 'hofNotifications',
        name: 'Resume',
        path: 'notifications/4?start=1'
      }]);
    });
  });

  experiment('when user has manage accounts scope', () => {
    test('they can view create account link', async () => {
      const request = createRequest(scope.manageAccounts);
      const config = getManageTabConfig(request);
      expect(getAllLinks(config)).to.equal([
        {
          group: 'reports',
          name: 'Key performance indicators',
          path: '/reporting/kpi-reporting'
        }, {
          group: 'accounts',
          name: 'Create an internal account',
          path: '/account/create-user'
        }
      ]);
    });
  });

  experiment('when user has manage accounts scope', () => {
    let request;
    beforeEach(() => {
      request = createRequest(scope.chargeVersionWorkflowReviewer);
    });

    test('they can only view check licences link', async () => {
      sandbox.stub(config.featureToggles, 'allowChargeVersionUploads').value(false);
      expect(getAllLinks(getManageTabConfig(request))).to.equal([
        {
          group: 'chargeInformationWorkflow',
          name: 'Check licences in workflow',
          path: '/charge-information-workflow'
        }

      ]);
    });

    test('they can view upload a file link as well as check licences link', async () => {
      sandbox.stub(config.featureToggles, 'allowChargeVersionUploads').value(true);
      expect(getAllLinks(getManageTabConfig(request))).to.equal([
        {
          group: 'uploadChargeInformation',
          name: 'Upload a file',
          path: '/charge-information/upload'
        }, {
          group: 'chargeInformationWorkflow',
          name: 'Check licences in workflow',
          path: '/charge-information-workflow'
        }

      ]);
    });
  });
});
