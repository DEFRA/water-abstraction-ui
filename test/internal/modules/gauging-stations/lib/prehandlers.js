'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();
const preHandlers = require('../../../../../src/internal/modules/gauging-stations/lib/prehandlers');
const services = require('../../../../../src/internal/lib/connectors/services');
const h = sandbox.stub();
const GAUGINGSTATION_ID = '0dd992c3-86e6-4410-963c-cc61d51bef40';
const LICENCE_ID = '22c784b7-b141-4fd0-8ee1-78ea7ae783bc';

experiment('prehandlers', () => {
  let request;
  beforeEach(async () => {
    request = {
      params: {
        gaugingStationId: GAUGINGSTATION_ID,
        licenceId: LICENCE_ID
      }
    };

    sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves();
    sandbox.stub(services.water.gaugingStations, 'getGaugingStationLicences').resolves([]);
  });

  afterEach(() => sandbox.restore());

  experiment('.loadGaugingStation by gaugingstationsId', () => {
    beforeEach(async () => {
      await preHandlers.loadGaugingStation(request, h);
    });

    test('it calls the relevant service method', () => {
      expect(services.water.gaugingStations.getGaugingStationbyId.calledWith(GAUGINGSTATION_ID)).to.be.true();
    });
  });
});
