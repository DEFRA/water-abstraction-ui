'use strict';

const server = require('../../../../server-internal');
const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const {
  getStep
} = require('internal/modules/notifications/controller');
const services = require('internal/lib/connectors/services');

if (process.env.TEST_MODE) {
  experiment('findLastEmail', () => {
    beforeEach(async () => {
      sandbox.stub(services.water.notifications, 'getLatestEmailByAddress');
    });

    afterEach(async () => {
      sandbox.restore();
    });

    test('returns a 400 for a missing email', async () => {
      const request = {
        method: 'GET',
        url: '/notifications/last'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 404 if no items are found', async () => {
      services.water.notifications.getLatestEmailByAddress.resolves({
        data: [],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 0, pageCount: 0 }
      });

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(404);
    });

    test('returns a 200 with the expected data', async () => {
      services.water.notifications.getLatestEmailByAddress.resolves({
        data: [{ id: 1 }, { id: 2 }],
        error: null,
        pagination: { page: 1, perPage: 1, totalRows: 2, pageCount: 1 }
      });

      const request = {
        method: 'GET',
        url: '/notifications/last?email=test'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
      expect(response.result.data[0].id).to.equal(1);
    });
  });
}

const getRequest = options => {
  return {
    auth: {
      credentials: {
        scope: ['hof_notifications']
      }
    },
    defra: {
      userId: 'test-user'
    },
    params: {
      id: 3
    },
    query: {
      step: 1,
      start: options.start
    },
    yar: {
      notificationsFlow: options.state || {},
      set: sandbox.stub(),
      get: sandbox.stub()
    }
  };
};

const userData = {
  userId: 'test-user'
};

const h = {
  view: sandbox.stub(),
  redirect: sandbox.stub()
};

const widget = {
  lookup: {
    filter: 'filter'
  }
};

const configData = {
  task_config_id: 'config-id',
  config: {
    title: 'page-title',
    steps: [{
      widgets: [widget]
    }, {
      widgets: [widget]
    }]
  },
  subtype: 'hof-stop'
};
experiment('modules/notifications/controller', async () => {
  beforeEach(() => {
    sandbox.stub(services.water.taskConfigs, 'findOne').resolves({ data: configData });
    sandbox.stub(services.idm.users, 'findOne').resolves({ data: { user_data: userData } });
    sandbox.stub(services.water.lookups, 'findMany').resolves({ data: 'widget-data' });
  });
  afterEach(async () => {
    await sandbox.restore();
  });
  experiment('.getStep', async () => {
    test('returns the expected template and view context when start is undefined', async () => {
      const request = getRequest({});
      await getStep(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/notifications/step');
      expect(view).to.be.an.object();
      expect(view.step).to.equal(configData.config.steps[0]);
      expect(view.formAction).to.equal(`/notifications/${configData.task_config_id}?step=${request.query.step}`);
      expect(view.pageTitle).to.equal(configData.config.title);
    });
  });
  experiment('.getStartFlow', async () => {
    test('redirects to expected url if contact details not set', async () => {
      const request = getRequest({ start: 1 });
      await getStep(request, h);
      const [url] = h.redirect.lastCall.args;
      const encodedUri = encodeURIComponent(`/notifications/${request.params.id}?start=${request.query.start}`);

      expect(url).to.equal(`/notifications/contact?redirect=${encodedUri}`);
    });
    test('returns the expected template and view context when contact details are set', async () => {
      const userData = {
        contactDetails: { name: 'Timothy' }
      };
      services.idm.users.findOne.resolves({ data: { user_data: userData } });
      const request = getRequest({ start: 1 });
      await getStep(request, h);

      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/notifications/step');
      expect(view).to.be.an.object();
      expect(view.step).to.equal(configData.config.steps[1]);
      expect(view.formAction).to.equal(`/notifications/${configData.task_config_id}?step=0`);
      expect(view.pageTitle).to.equal(configData.config.title);
    });
  });
});
