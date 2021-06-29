
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
    experiment('when a catchment name is known', () => {
      let result;
      beforeEach(async () => {
        services.water.gaugingStations.getGaugingStationbyId.returns({
          label: 'some station',
          catchmentName: 'some catchment'
        });
        result = await helpers.getCaption(request);
      });
      afterEach(async () => sandbox.restore());

      test('calls the relevant service to get the gauging station name', () => {
        expect(services.water.gaugingStations.getGaugingStationbyId.calledWith(request.params.gaugingStationId)).to.be.true();
      });
      test('returns the expected string', () => {
        expect(result).to.equal('some station at some catchment');
      });
    });

    experiment('when a catchment name is not known', () => {
      let result;
      beforeEach(async () => {
        services.water.gaugingStations.getGaugingStationbyId.returns({
          label: 'some station',
          catchmentName: null
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
  // getSelectedConditionText;

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
