
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');

const services = require('../../../../../src/internal/lib/connectors/services');
const helpers = require('../../../../../src/internal/modules/gauging-stations/lib/helpers');
const session = require('../../../../../src/internal/modules/gauging-stations/lib/session');

experiment('internal/modules/gauging-stations/controller', () => {
  beforeEach(async () => {
    sandbox.stub(session, 'get').resolves();
    sandbox.stub(session, 'merge').resolves({});

    sandbox.stub(services.water.licences, 'getLicenceByLicenceNumber').resolves();
    sandbox.stub(services.water.licenceVersionPurposeConditionsService, 'getLicenceVersionPurposeConditionsByLicenceId').resolves();
    sandbox.stub(services.water.gaugingStations, 'postLicenceLinkage').resolves();
    sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves({
      label: 'A Station'
    });
  });

  afterEach(async () => sandbox.restore());

  experiment('.redirectTo', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/some-random-place-in-the-workflow'
    };
    const desiredPath = '/a-new-destination';
    const h = { redirect: sandbox.spy() };

    experiment('When the check stage has been reached', () => {
      beforeEach(() => {
        session.get.returns({
          checkStageReached: true
        });
        helpers.redirectTo(request, h, desiredPath);
      });
      afterEach(async () => sandbox.restore());
      test('redirects the user to the end of the flow', async () => {
        expect(h.redirect.calledWith(`${request.path}/../check`));
      });
    });

    experiment('When the check stage has NOT been reached', () => {
      beforeEach(() => {
        session.get.returns({
          checkStageReached: false
        });
        helpers.redirectTo(request, h, desiredPath);
      });
      afterEach(async () => sandbox.restore());
      test('redirects the user to the default destination in the flow', async () => {
        expect(h.redirect.calledWith(`${request.path}/../${desiredPath}`));
      });
    });
  });

  experiment('.isLicenceNumberValid', () => {
    let result;
    const request = {
      payload: {
        licenceNumber: 'AB/123'
      }
    };

    beforeEach(async () => {
      await services.water.licences.getLicenceByLicenceNumber.returns({
        licenceId: 'some-id',
        licenceRef: 'AB/123'
      });
      result = await helpers.isLicenceNumberValid(request);
    });
    afterEach(async () => sandbox.restore());
    experiment('When the licence fetching is successful', () => {
      test('session.merge is called with the licence payload', () => {
        expect(session.merge.calledWith(request, {
          fetchedLicence: {
            licenceId: 'some-id',
            licenceRef: 'AB/123'
          }
        }));
      });

      test('result is truthy', () => {
        expect(result).to.be.true();
      });
    });
    experiment('When the licence fetching throws an error', () => {
      beforeEach(async () => {
        await services.water.licences.getLicenceByLicenceNumber.throws(new Error());
        result = await helpers.isLicenceNumberValid(request);
      });
      test('session.merge is called with undefined as the licence body', () => {
        expect(session.merge.calledWith(request, {
          fetchedLicence: undefined
        }));
      });
      test('result is falsy', () => {
        expect(result).to.be.false();
      });
    });
  });

  experiment('.fetchConditionsForLicence', () => {
    let result;
    const request = {};

    beforeEach(async () => {
      await services.water.licenceVersionPurposeConditionsService.getLicenceVersionPurposeConditionsByLicenceId.returns({
        data: [{
          conditionId: 'somecondition'
        }]
      });
      session.get.returns({
        fetchedLicence: {
          id: 'some-licence-id'
        }
      });
      result = await helpers.fetchConditionsForLicence(request);
    });
    afterEach(async () => sandbox.restore());
    experiment('When the conditions fetching is successful', () => {
      test('session.get is called', () => {
        expect(session.get.called).to.be.true();
      });
      test('getLicenceVersionPurposeConditionsByLicenceId is called', () => {
        expect(services.water.licenceVersionPurposeConditionsService.getLicenceVersionPurposeConditionsByLicenceId.called).to.be.true();
      });
      test('returns an expected output', () => {
        expect(result).to.equal(
          [{
            conditionId: 'somecondition'
          }]
        );
      });
    });
    experiment('When the condition fetching throws an error', () => {
      beforeEach(async () => {
        await services.water.licenceVersionPurposeConditionsService.getLicenceVersionPurposeConditionsByLicenceId.throws(new Error());
        result = await helpers.fetchConditionsForLicence(request);
      });
      afterEach(async () => sandbox.restore());
      test('the returned result is an empty array', () => {
        test('session.get is called', () => {
          expect(session.get.called).to.be.true();
        });
        test('getLicenceVersionPurposeConditionsByLicenceId is called', () => {
          expect(services.water.licenceVersionPurposeConditionsService.getLicenceVersionPurposeConditionsByLicenceId.called).to.be.true();
        });
        test('returns an expected output', () => {
          expect(result).to.equal([]);
        });
      });
    });
  });

  experiment('.getCaption', () => {
    const request = {
      params: {
        gaugingStationId: 'some-gauging-station-id'
      }
    };
    experiment('when a river name is known', () => {
      let result;
      beforeEach(async () => {
        services.water.gaugingStations.getGaugingStationbyId.returns({
          label: 'some station',
          riverName: 'some river'
        });
        result = await helpers.getCaption(request);
      });
      afterEach(async () => sandbox.restore());

      test('calls the relevant service to get the gauging station name', () => {
        expect(services.water.gaugingStations.getGaugingStationbyId.calledWith(request.params.gaugingStationId)).to.be.true();
      });
      test('returns the expected string', () => {
        expect(result).to.equal('some river at some station');
      });
    });

    experiment('when a river name is not known', () => {
      let result;
      beforeEach(async () => {
        services.water.gaugingStations.getGaugingStationbyId.returns({
          label: 'some station',
          riverName: null
        });
        result = await helpers.getCaption(request);
      });
      afterEach(async () => sandbox.restore());

      test('calls the relevant service to get the gauging station name', () => {
        expect(services.water.gaugingStations.getGaugingStationbyId.calledWith(request.params.gaugingStationId)).to.be.true();
      });
      test('returns the expected string', () => {
        expect(result).to.equal(`some station`);
      });
    });
  });

  experiment('.groupLicenceConditions', () => {
    const data = {
      data: [
        {
          licenceGaugingStationId: 'ee886147-ec1d-4a0f-8598-fc3f5886ee84',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 1,
          abstractionPeriodEndDay: 11,
          abstractionPeriodEndMonth: 11,
          restrictionType: 'flow',
          alertType: 'stop_or_reduce',
          thresholdValue: '100',
          thresholdUnit: 'Ml/d',
          comstatus: null,
          dateStatusUpdated: null,
          licenceVersionPurposeConditionId: null,
          licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
          licenceRef: '11/42/18.6.2/262',
          startDate: '1965-11-26',
          label: 'STATION ROAD',
          gridReference: 'TQ7360023530',
          catchmentName: '',
          riverName: '',
          wiskiId: 'E6681',
          stationReference: 'E6681',
          easting: null,
          northing: null
        },
        {
          licenceGaugingStationId: 'd6369186-a485-48a1-878f-05b3b51a7c7f',
          abstractionPeriodStartDay: 13,
          abstractionPeriodStartMonth: 1,
          abstractionPeriodEndDay: 13,
          abstractionPeriodEndMonth: 2,
          restrictionType: 'flow',
          alertType: 'reduce',
          thresholdValue: '113',
          thresholdUnit: 'Ml/d',
          comstatus: null,
          dateStatusUpdated: null,
          licenceVersionPurposeConditionId: null,
          licenceId: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc',
          licenceRef: '11/42/18.6.2/262',
          startDate: '1965-11-26',
          label: 'STATION ROAD',
          gridReference: 'TQ7360023530',
          catchmentName: '',
          riverName: '',
          wiskiId: 'E6681',
          stationReference: 'E6681',
          easting: null,
          northing: null
        },
        {
          licenceGaugingStationId: '9177f85d-916c-4d51-8db7-74246d228b7b',
          abstractionPeriodStartDay: 1,
          abstractionPeriodStartMonth: 1,
          abstractionPeriodEndDay: 2,
          abstractionPeriodEndMonth: 2,
          restrictionType: 'flow',
          alertType: 'stop_or_reduce',
          thresholdValue: '115',
          thresholdUnit: 'Ml/d',
          comstatus: null,
          dateStatusUpdated: null,
          licenceVersionPurposeConditionId: null,
          licenceId: '6e21a77b-1525-459d-acb8-3615e5d53f06',
          licenceRef: '2672520010',
          startDate: '1966-12-30',
          label: 'STATION ROAD',
          gridReference: 'TQ7360023530',
          catchmentName: '',
          riverName: '',
          wiskiId: 'E6681',
          stationReference: 'E6681',
          easting: null,
          northing: null
        }
      ] };
    const request = {
      path: 'http://example.com/monitoring-stations/123/untagging-licence/remove-tag',
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: data
      }
    };
    const requestSimple = {
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: data
      }
    };
    const formContentSingleSelected = {
      fields: [ { name: 'selectedLicence',
        options: {
          choices: [
            {
              licenceGaugingStationId: '9177f85d-916c-4d51-8db7-74246d228b7b',
              value: '6e21a77b-1525-459d-acb8-3615e5d53f06',
              label: ' Reduce at 115 Megalitres per day',
              hint: '2672520010',
              licenceRef: '2672520010',
              alertType: 'stop_or_reduce',
              thresholdValue: '115',
              thresholdUnit: 'Megalitres per day',
              licenceId: '6e21a77b-1525-459d-acb8-3615e5d53f06'
            }
          ],
          label: '',
          widget: 'radio',
          required: true,
          controlClass: 'govuk-input govuk-input--width-10',
          errors: {
            any: {
              required: {
                message: 'Select a licence number'
              },
              empty: {
                message: 'Select a licence number'
              }
            }
          }
        },
        errors: [],
        value: '6e21a77b-1525-459d-acb8-3615e5d53f06'
      } ]
    };

    experiment('.handleRemovePost multiple', () => {
      let removeRes;
      beforeEach(async () => {
        session.get.returns({
          selectedCondition: { value: ['6e21a77b-1525-459d-acb8-3615e5d53f06'] },
          licenceGaugingStations: data.data
        });

        sandbox.stub(services.water.gaugingStations, 'postLicenceLinkageRemove').returns(true);
        removeRes = await helpers.handleRemovePost(requestSimple);
      });

      afterEach(async () => sandbox.restore());

      test('return a result', () => {
        expect(removeRes).to.equal([ true ]);
      });
    });

    experiment('.handleRemovePost single', () => {
      let removeResSingle;
      beforeEach(async () => {
        session.get.returns({
          selectedLicence: formContentSingleSelected.fields[0],
          licenceGaugingStations: data.data
        });

        sandbox.stub(services.water.gaugingStations, 'postLicenceLinkageRemove').returns(true);
        removeResSingle = await helpers.handleRemovePost(requestSimple);
      });

      afterEach(async () => sandbox.restore());

      test('return a result', () => {
        expect(removeResSingle).to.equal([ true ]);
      });
    });

    experiment('.groupLicenceConditions ', () => {
      let result;
      beforeEach(async () => {
        result = await helpers.groupLicenceConditions(request);
      });
      afterEach(async () => sandbox.restore());

      test('returns the expected linkages', () => {
        expect(result[0].licenceRef).to.equal('11/42/18.6.2/262');
        expect(result[0].linkages.length).to.equal(2);
        expect(result[1].licenceRef).to.equal('2672520010');
        expect(result[1].linkages.length).to.equal(1);
      });

      test('.toLongForm is returning expected words', () => {
        expect(helpers.toLongForm('gal', 'Units')).to.equal('Gallons');
        expect(helpers.toLongForm('Ml/d', 'Units')).to.equal('Megalitres per day');
        expect(helpers.toLongForm('m³', 'Units')).to.equal('Cubic metres');
        expect(helpers.toLongForm('l/d', 'Units')).to.equal('Litres per day');
        expect(helpers.toLongForm('stop_or_reduce', 'AlertType')).to.equal('Reduce');
        expect(helpers.toLongForm('reduce', 'AlertType')).to.equal('Reduce');
        expect(helpers.toLongForm('stop', 'AlertType')).to.equal('Stop');
      });

      test('.toLongForm working without context', () => {
        expect(helpers.toLongForm('gal', '')).to.equal('Gallons');
        expect(helpers.toLongForm('Ml/d', '')).to.equal('Megalitres per day');
        expect(helpers.toLongForm('m³', '')).to.equal('Cubic metres');
        expect(helpers.toLongForm('l/d', '')).to.equal('Litres per day');
        expect(helpers.toLongForm('stop_or_reduce', '')).to.equal('Reduce');
        expect(helpers.toLongForm('reduce', '')).to.equal('Reduce');
        expect(helpers.toLongForm('stop', '')).to.equal('Stop');
      });

      test('.addCheckboxFields returns checkbox labels', () => {
        expect(helpers.addCheckboxFields(data.data).length).to.equal(3);
        expect(helpers.addCheckboxFields(data.data)[0].label).to.equal(' Reduce at 100 Megalitres per day');
      });

      test('.selectedConditionWithLinkages handles expired session gracefully', () => {
        expect(helpers.selectedConditionWithLinkages(request).length).to.equal(0);
      });
    });
  });

  experiment('.handlePost', () => {
    const request = {
      params: {
        gaugingStationId: 'some-gauging-station-id'
      }
    };
    beforeEach(async () => {
      session.get.returns({
        fetchedLicence: {
          id: 'some-licence-id'
        },
        condition: {
          value: 'condition-guid'
        },
        threshold: {
          value: 100
        },
        unit: {
          value: 'cups'
        },
        startDate: {
          value: '01-02'
        },
        endDate: {
          value: '03-04'
        },
        alertType: {
          value: 'stop'
        },
        volumeLimited: {
          value: false
        }
      });

      await helpers.handlePost(request);
    });
    afterEach(async () => sandbox.restore());

    test('calls session.get', () => {
      expect(session.get.called).to.be.true();
    });
    test('calls the post service with the right params', () => {
      expect(services.water.gaugingStations.postLicenceLinkage.calledWith(
        'some-gauging-station-id',
        'some-licence-id',
        {
          thresholdUnit: 'cups',
          thresholdValue: 100,
          restrictionType: 'level',
          licenceVersionPurposeConditionId: 'condition-guid',
          abstractionPeriod: {
            startDay: 1,
            startMonth: 2,
            endDay: 3,
            endMonth: 4
          },
          alertType: 'stop'
        }
      ));
    });
  });
});
