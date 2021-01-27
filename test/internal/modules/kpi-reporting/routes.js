'use strict';

const { experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { scope } = require('internal/lib/constants');
const routes = require('internal/modules/kpi-reporting/routes');
const controller = require('internal/modules/kpi-reporting/controller');
const { find } = require('lodash');

experiment('internal/modules/kpi-reporting/routes', () => {
  experiment('.getKpiReporting', () => {
    const route = find(routes, { path: '/reporting/kpi-reporting' });
    test('route is restricted to those that have the manage tab', async () => {
      expect(route.config.auth.scope).to.only.include(scope.hasManageTab);
    });
    test('route has the correct path', async () => {
      expect(route.path).to.equal('/reporting/kpi-reporting');
    });
    test('route has the correct method', async () => {
      expect(route.method).to.equal('GET');
    });
    test('route has the correct controller', async () => {
      expect(route.handler).to.equal(controller.getKPIDashboard);
    });
  });
});
