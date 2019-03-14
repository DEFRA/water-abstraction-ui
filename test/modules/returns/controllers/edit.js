const { expect } = require('code');
const { experiment, test, beforeEach, afterEach, fail } = exports.lab = require('lab').script();
const sinon = require('sinon');
const controller = require('../../../../src/modules/returns/controllers/edit');
const { returns } = require('../../../../src/lib/connectors/water');
const helpers = require('../../../../src/modules/returns/lib/helpers.js');
const returnPath = require('../../../../src/modules/returns/lib/return-path');
const permissions = require('../../../../src/lib/permissions');
const sessionHelpers = require('../../../../src/modules/returns/lib/session-helpers.js');
const forms = require('../../../../src/lib/forms');
const flowHelpers = require('../../../../src/modules/returns/lib/flow-helpers.js');

const sandbox = sinon.createSandbox();

const eventId = 'event_1';
const userName = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';
const csrfToken = 'csrf';
const returnId = 'v1:1:01/123:4567:2017-11-01:2018-10-31';
const documentHeaders = ['documentHeader_1', 'documentHeader_2'];

const createRequest = (isInternal, isNil, internal, external) => {
  return {
    view: {
      csrfToken
    },
    query: {
      returnId
    },
    returns: {
      data: {
        returnId,
        licenceNumber: '123/456',
        versionNumber: '1',
        reading: {
          type: 'measured',
          units: 'm³'
        },
        meters: [
          {
            manufacturer: 'Unknown',
            serialNumber: '4678',
            startReading: 58,
            multiplier: 1,
            units: 'm³',
            readings: {
              '2017-11-01_2017-11-30': 60,
              '2017-12-01_2017-12-31': 65,
              '2018-01-01_2018-01-31': 78,
              '2018-02-01_2018-02-28': 82,
              '2018-03-01_2018-03-31': 85,
              '2018-04-01_2018-04-30': null,
              '2018-05-01_2018-05-31': null,
              '2018-06-01_2018-06-30': null,
              '2018-07-01_2018-07-31': null,
              '2018-08-01_2018-08-31': null,
              '2018-09-01_2018-09-30': null,
              '2018-10-01_2018-10-31': null
            }
          }
        ],
        isNil,
        lines: [
          {
            startDate: '2017-11-01',
            endDate: '2017-11-30',
            timePeriod: 'month',
            quantity: 2
          },
          {
            startDate: '2017-12-01',
            endDate: '2017-12-31',
            timePeriod: 'month',
            quantity: 5
          },
          {
            startDate: '2018-01-01',
            endDate: '2018-01-31',
            timePeriod: 'month',
            quantity: 13
          },
          {
            startDate: '2018-02-01',
            endDate: '2018-02-28',
            timePeriod: 'month',
            quantity: 4
          },
          {
            startDate: '2018-03-01',
            endDate: '2018-03-31',
            timePeriod: 'month',
            quantity: 3
          },
          {
            startDate: '2018-04-01',
            endDate: '2018-04-30',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-05-01',
            endDate: '2018-05-31',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-06-01',
            endDate: '2018-06-30',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-07-01',
            endDate: '2018-07-31',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-08-01',
            endDate: '2018-08-31',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-09-01',
            endDate: '2018-09-30',
            timePeriod: 'month',
            quantity: 0
          },
          {
            startDate: '2018-10-01',
            endDate: '2018-10-31',
            timePeriod: 'month',
            quantity: 0
          }
        ],
        metadata: { nald: {
          periodEndDay: '30',
          periodEndMonth: '9',
          periodStartDay: '1',
          periodStartMonth: '5' }
        }
      },
      isInternal
    },
    auth: {
      credentials: {
        username: userName,
        entity_id: entityId,
        companyId,
        scope: [{
          internal,
          external
        }]
      }
    }
  };
};

const createReturn = (isInternal) => ({
  data: [{
    licenceNumber: '123/456',
    returnId,
    isInternal,
    reading: {
      type: 'measured'
    }
  }],
  versionNumber: 1
});

experiment('edit controller', () => {
  let h;
  beforeEach(async () => {
    h = {
      view: sandbox.stub(),
      redirect: sandbox.stub()
    };
    sandbox.stub(returns, 'getReturn').returns(createReturn());
    sandbox.stub(helpers, 'getLicenceNumbers').returns(documentHeaders);
    sandbox.stub(returnPath, 'isInternalEdit');
    sandbox.stub(permissions, 'isInternal');
    sandbox.stub(permissions, 'isExternalReturns');
    sandbox.stub(helpers, 'getViewData').returns({ view: csrfToken });
    sandbox.stub(sessionHelpers, 'submitReturnData');
    sandbox.stub(sessionHelpers, 'deleteSessionData');
    sandbox.stub(sessionHelpers, 'saveSessionData');
    sandbox.stub(forms, 'getValues');
    sandbox.stub(forms, 'setValues').returns({ form: { fields: 'fields' } });
    sandbox.stub(forms, 'handleRequest');
    sandbox.stub(forms, 'importData').returns({
      '2017-11-01_2017-11-30': 60,
      '2017-12-01_2017-12-31': 65,
      '2018-01-01_2018-01-31': 78,
      '2018-02-01_2018-02-28': 82,
      '2018-03-01_2018-03-31': 85,
      '2018-04-01_2018-04-30': null,
      '2018-05-01_2018-05-31': null,
      '2018-06-01_2018-06-30': null,
      '2018-07-01_2018-07-31': null,
      '2018-08-01_2018-08-31': null,
      '2018-09-01_2018-09-30': null,
      '2018-10-01_2018-10-31': null,
      csrfToken
    });

    sandbox.spy(flowHelpers, 'getPreviousPath');
    sandbox.spy(flowHelpers, 'getNextPath');
    sandbox.spy(helpers, 'getReturnTotal');
  });
  afterEach(async () => {
    sandbox.restore();
  });
  experiment('getAmounts', () => {
    test('it should take you to returns/internal/form page with returns data', async () => {
      permissions.isExternalReturns.returns(true);
      const request = createRequest();
      const returns = createReturn();

      await controller.getAmounts(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return.data).to.equal(returns.data);
    });
    test('it should call getPreviousPath with STEP_START, request and returns.data', async () => {
      permissions.isExternalReturns.returns(true);
      const request = createRequest();
      const returns = createReturn();

      await controller.getAmounts(request, h);

      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_START, request, { ...returns, versionNumber: 2 });

      expect(getPreviousPathCalled).to.be.true();
    });
    test('throws a Boom unauthorized error if no documentHeaders', async () => {
      helpers.getLicenceNumbers.returns([]);
      try {
        await controller.getAmounts(createRequest(), h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(401);
      }
    });
    test('throws a Boom unauthorized error if user is not internalEdit or externalReturns', async () => {
      returnPath.isInternalEdit.returns(false);
      permissions.isExternalReturns.returns(false);
      try {
        await controller.getAmounts(createRequest(), h);
        fail();
      } catch (err) {
        expect(err.isBoom).to.equal(true);
        expect(err.output.statusCode).to.equal(401);
      }
    });
  });

  experiment('postAmounts', () => {
    test('it should call getNextPath with STEP_START, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ isNil: true });
      const request = createRequest();

      await controller.postAmounts(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_START, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postAmounts(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getNilReturn', () => {
    test('it should take you to returns/internal/nil-return page with returns data', async () => {
      const request = createRequest();

      await controller.getNilReturn(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/nil-return');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_NIL_RETURN, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getNilReturn(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_NIL_RETURN, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postConfirm', () => {
    test('it should call getNextPath with STEP_START, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      const request = createRequest();

      await controller.postConfirm(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_NIL_RETURN, request);

      expect(getNextPathCalled).to.be.true();
    });
  });

  experiment('getSubmitted', () => {
    test('it should take you to returns/return?id=returnId', async () => {
      const request = createRequest(false);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/submitted');
      expect(view.return).to.equal(request.returns.data);
    });
    test('returnUrl should be returns/return?id=returnId page for external users', async () => {
      const request = createRequest(false);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(view.returnUrl).to.equal(`/returns/return?id=${returnId}`);
    });
    test('returnUrl should be admin/returns/return?id=returnId page for internal users', async () => {
      const request = createRequest(true);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(view.returnUrl).to.equal(`/admin/returns/return?id=${returnId}`);
    });
    test('pageTitle should be "Abstraction return - nil submitted" if isNil is true', async () => {
      const request = createRequest(false, true);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(view.pageTitle).to.equal('Abstraction return - nil submitted');
    });
    test('pageTitle should be "Abstraction return - submitted" if isNil is false', async () => {
      const request = createRequest(false, false);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(view.pageTitle).to.equal('Abstraction return - submitted');
    });
  });

  experiment('getMethod', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getMethod(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_METHOD, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getMethod(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_METHOD, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postMethod', () => {
    test('it should call getNextPath with STEP_METHOD, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ method: 'abstraction volumes' });
      const request = createRequest();

      await controller.postMethod(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METHOD, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMethod(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getUnits', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_UNITS, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getUnits(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_UNITS, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postUnits', () => {
    test('it should call getNextPath with STEP_UNITS, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ units: 'Ml' });

      const request = createRequest();

      await controller.postUnits(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_UNITS, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getSingleTotal', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getSingleTotal(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_SINGLE_TOTAL, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getSingleTotal(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_SINGLE_TOTAL, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postSingleTotal', () => {
    test('it should call getNextPath with STEP_SINGLE_TOTAL, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ isSingleTotal: false, total: 8577 });

      const request = createRequest();

      await controller.postSingleTotal(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_SINGLE_TOTAL, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postSingleTotal(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getBasis', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getBasis(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_BASIS, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getBasis(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_BASIS, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postBasis', () => {
    test('it should call getNextPath with STEP_BASIS, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ basis: 'basis' });

      const request = createRequest();

      await controller.postBasis(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_BASIS, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postBasis(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getQuantities', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getQuantities(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_QUANTITIES, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getQuantities(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_QUANTITIES, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postQuantities', () => {
    test('it should call getNextPath with STEP_QUANTITIES, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({
        '2017-11-01_2017-11-30': 60,
        '2017-12-01_2017-12-31': 65,
        '2018-01-01_2018-01-31': 78,
        '2018-02-01_2018-02-28': 82,
        '2018-03-01_2018-03-31': 85,
        '2018-04-01_2018-04-30': null,
        '2018-05-01_2018-05-31': null,
        '2018-06-01_2018-06-30': null,
        '2018-07-01_2018-07-31': null,
        '2018-08-01_2018-08-31': null,
        '2018-09-01_2018-09-30': null,
        '2018-10-01_2018-10-31': null,
        csrfToken
      });

      const request = createRequest();

      await controller.postQuantities(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_QUANTITIES, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postQuantities(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getConfirm', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getConfirm(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/confirm');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_CONFIRM, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getConfirm(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_CONFIRM, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
    test('it should call getReturnTotal with request.returns.data', async () => {
      const request = createRequest();

      await controller.getConfirm(request, h);
      const getReturnTotalCalled = helpers.getReturnTotal.calledWith(request.returns.data);

      expect(getReturnTotalCalled).to.be.true();
    });
  });

  experiment('getMeterDetails', () => {
    test('it should take you to water/returns/meter-details page with returns data', async () => {
      const request = createRequest();

      await controller.getMeterDetails(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/meter-details');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_METER_DETAILS, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getMeterDetails(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_METER_DETAILS, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postMeterDetails', () => {
    test('it should call getNextPath with STEP_METER_DETAILS, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ basis: 'basis' });

      const request = createRequest();

      await controller.postMeterDetails(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METER_DETAILS, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterDetails(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/meter-details');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getMeterUnits', () => {
    test('it should take you to water/returns/internal/form page with returns data', async () => {
      const request = createRequest();

      await controller.getMeterUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_METER_UNITS, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getMeterUnits(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_METER_UNITS, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postMeterUnits', () => {
    test('it should call getNextPath with STEP_METER_UNITS, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ units: 'm³' });

      const request = createRequest();

      await controller.postMeterUnits(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METER_UNITS, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/internal/form');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getMeterReadings', () => {
    test('it should take you to water/returns/meter-readings page with returns data', async () => {
      const request = createRequest();

      await controller.getMeterReadings(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/meter-readings');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_METER_READINGS, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getMeterReadings(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_METER_READINGS, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postMeterReadings', () => {
    test('it should call getNextPath with STEP_METER_READINGS, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ basis: 'basis' });

      const request = createRequest();

      await controller.postMeterReadings(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METER_READINGS, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should keep you on the same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterReadings(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('water/returns/meter-readings');
      expect(view.return).to.equal(request.returns.data);
    });
  });
});
