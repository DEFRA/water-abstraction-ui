'use strict';

const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { scope } = require('internal/lib/constants');
const controller = require('internal/modules/manage/controller');
const { set } = require('lodash');
const sandbox = require('sinon').createSandbox();

const createRequest = () => {
  const request = {
    view: {}
  };
  set(request, 'auth.credentials.scope', scope.hofNotifications);
  return request;
};

experiment('manage - controller', () => {
  let h, request;

  beforeEach(async () => {
    request = createRequest();
    h = {
      view: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('manage tab', () => {
    test('uses the correct template', async () => {
      await controller.getManageTab(request, h);
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/notifications/manage-tab');
    });

    test('view data includes arrays of links', async () => {
      await controller.getManageTab(request, h);
      const [, view] = h.view.lastCall.args;
      const keys = Object.keys(view);
      expect(keys).to.equal([
        'reports',
        'returnNotifications',
        'licenceNotifications',
        'hofNotifications',
        'accounts',
        'billing'
      ]);
    });
  });
});
