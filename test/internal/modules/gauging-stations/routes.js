'use strict';

const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();
const { expect } = require('@hapi/code');
const routes = require('internal/modules/gauging-stations/routes');

lab.experiment('/internal/modules/gauging-stations/routes', () => {
  lab.test('has the right method', () => {
    expect(routes.getMonitoringStation.method).to.equal('GET');
  });
});
