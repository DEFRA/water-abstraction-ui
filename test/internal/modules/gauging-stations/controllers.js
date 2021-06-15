'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const controllers = require('internal/modules/gauging-stations/controller');

experiment('internal/modules/gauging-stations/controller', () => {
  let h;

  const gaugingStationId = uuid();

  const res = [{
    gaugingStationId: 'e3e95a10-a989-42ae-9692-feac91f06ffb',
    licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
    licenceVersionPurposeConditionId: '00304a0e-0ff7-4820-a3e1-f2cd48f2ae62',
    gridReference: '1',
    easting: '2',
    northing: '3',
    wiskiId: '4',
    licenceRef: '5',
    abstractionPeriodStartDay: '1',
    abstractionPeriodStartMonth: '11',
    abstractionPeriodEndDay: '30',
    abstractionPeriodEndMonth: '11',
    restrictionType: 'flow',
    thresholdValue: '100',
    thresholdUnit: 'Ml',
    stationReference: '1'
  }];

  beforeEach(async () => {
    const callingUserId = 123;
    const request = {
      params: {
        gaugingStationId: gaugingStationId
      },
      payload: {
        callingUserId
      },
      pre: {
        gaugingStations: {
          data: res
        }
      }
    };

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
    await controllers.getLicencesForGaugingStation(request, h);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the page is loaded with the correct nunjucks template', async () => {
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/gauging-stations/licences');
  });

  test('the table caption is correct', async () => {
    const [, { tableCaption }] = h.view.lastCall.args;
    const expectedCaption = 'All licences for gaugingstation';
    expect(tableCaption).to.equals(expectedCaption);
  });

  experiment('.getLicencesForGaugingStation fails gracefully', () => {
    beforeEach(async () => {
      const callingUserId = 123;

      const request = {
        params: {
          gaugingStationId: 'abc-123'
        },
        payload: {
          callingUserId
        },
        pre: {
          gaugingStations: {
            data: [{}]
          }
        }
      };

      h = {
        view: sandbox.spy(),
        postRedirectGet: sandbox.stub(),
        redirect: sandbox.stub()
      };
      await controllers.getLicencesForGaugingStation(request, h);
    });

    test('the page is loaded with the correct nunjucks template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/errors/404');
    });

    test('the page title is correct', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      const expectedPageTitle = 'We cannot find information for monitoring station with id abc-123';
      expect(pageTitle).to.equals(expectedPageTitle);
    });
  });
});
