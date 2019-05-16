const { expect } = require('code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const sinon = require('sinon');
const controller = require('../../../../../src/external/modules/returns/controllers/edit');
const { returns } = require('../../../../../src/external/lib/connectors/water');
const helpers = require('../../../../../src/external/modules/returns/lib/helpers');
const { scope: { internal, external } } = require('../../../../../src/external/lib/constants');
const returnPath = require('../../../../../src/external/modules/returns/lib/return-path');
const permissions = require('../../../../../src/external/lib/permissions');
const sessionHelpers = require('../../../../../src/external/modules/returns/lib/session-helpers');
const forms = require('../../../../../src/shared/lib/forms');
const flowHelpers = require('../../../../../src/external/modules/returns/lib/flow-helpers');

const sandbox = sinon.createSandbox();

const userName = 'user_1';
const entityId = 'entity_1';
const companyId = 'company_1';
const csrfToken = 'csrf';
const returnId = 'v1:1:01/123:4567:2017-11-01:2018-10-31';
const documentHeaders = ['documentHeader_1', 'documentHeader_2'];
const returnLines = {
  startReading: 45,
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
};

const createRequest = (isInternal, isNil, readingType) => {
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
          type: readingType,
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
              startReading: 58,
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
        scope: [ isInternal ? internal : external ]
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
    sandbox.stub(forms, 'importData').returns(returnLines);

    sandbox.spy(flowHelpers, 'getPreviousPath');
    sandbox.spy(flowHelpers, 'getNextPath');
    sandbox.spy(helpers, 'getReturnTotal');
  });
  afterEach(async () => {
    sandbox.restore();
  });
  experiment('getAmounts', () => {
    test('renders nunjucks/returns/form.njk with returns data', async () => {
      permissions.isExternalReturns.returns(true);
      const request = createRequest();

      await controller.getAmounts(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });

    test('calls getPreviousPath with STEP_START, request and returns.data', async () => {
      permissions.isExternalReturns.returns(true);
      const request = createRequest();

      await controller.getAmounts(request, h);

      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_START, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
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
    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postAmounts(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
      expect(view.back).to.equal('/returns');
    });
  });

  experiment('getNilReturn', () => {
    test('it should render nunjucks/returns/nil-return.njk with returns data', async () => {
      const request = createRequest();

      await controller.getNilReturn(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/nil-return.njk');
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
    let meters = [
      {
        manufacturer: 'Unknown',
        serialNumber: '4678',
        startReading: 58,
        multiplier: 1,
        units: 'm³',
        readings: {
          startReading: 58,
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
    ];
    test('it should call getNextPath with STEP_START, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      const request = createRequest();

      await controller.postConfirm(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_NIL_RETURN, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should delete meter details if reading.type is "estimated"', async () => {
      forms.handleRequest.returns({ isValid: true, meters });
      const request = createRequest(null, null, 'estimated');

      await controller.postConfirm(request, h);
      const [updatedData] = sessionHelpers.submitReturnData.lastCall.args;
      expect(updatedData.meters).to.equal([]);
    });
    test('it should leave meter details as they are if reading.type is "measured"', async () => {
      forms.handleRequest.returns({ isValid: true, meters });
      const request = createRequest(null, null, 'measured');

      await controller.postConfirm(request, h);
      const [updatedData] = sessionHelpers.submitReturnData.lastCall.args;
      expect(updatedData.meters).to.equal(meters);
    });
  });

  experiment('getSubmitted', () => {
    test('it should render nunjucks/returns/submitted.njk with returns data', async () => {
      const request = createRequest(false);

      await controller.getSubmitted(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/submitted.njk');
      expect(view.return).to.equal(request.returns.data);
    });
    test('returnUrl should be returns/return?id=returnId page for external users', async () => {
      const request = createRequest(false);

      await controller.getSubmitted(request, h);
      const [, view] = h.view.lastCall.args;

      expect(view.returnUrl).to.equal(`/returns/return?id=${returnId}`);
    });
    test('returnUrl should be admin/returns/return?id=returnId page for internal users', async () => {
      const request = createRequest(true);

      await controller.getSubmitted(request, h);
      const [, view] = h.view.lastCall.args;

      expect(view.returnUrl).to.equal(`/admin/returns/return?id=${returnId}`);
    });
    test('pageTitle should be "Abstraction return - nil submitted" if isNil is true', async () => {
      const request = createRequest(false, true);

      await controller.getSubmitted(request, h);
      const [, view] = h.view.lastCall.args;

      expect(view.pageTitle).to.equal('Abstraction return - nil submitted');
    });
    test('pageTitle should be "Abstraction return - submitted" if isNil is false', async () => {
      const request = createRequest(false, false);

      await controller.getSubmitted(request, h);
      const [, view] = h.view.lastCall.args;

      expect(view.pageTitle).to.equal('Abstraction return - submitted');
    });
  });

  experiment('getMethod', () => {
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      const request = createRequest();

      await controller.getMethod(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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

    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMethod(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
      expect(view.back).to.equal(`/return?returnId=${request.returns.data.returnId}`);
    });
  });

  experiment('getUnits', () => {
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      const request = createRequest();

      await controller.getUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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
    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getSingleTotal', () => {
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      permissions.isInternal.returns(true);
      const request = createRequest(true);

      await controller.getSingleTotal(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_SINGLE_TOTAL, request and request.returns.data', async () => {
      permissions.isInternal.returns(true);
      const request = createRequest();

      await controller.getSingleTotal(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_SINGLE_TOTAL, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postSingleTotal', () => {
    test('it should call getNextPath with STEP_SINGLE_TOTAL, request', async () => {
      permissions.isInternal.returns(true);
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ isSingleTotal: false, total: 8577 });

      const request = createRequest();

      await controller.postSingleTotal(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_SINGLE_TOTAL, request);

      expect(getNextPathCalled).to.be.true();
    });

    test('renders the same page if form is not valid', async () => {
      permissions.isInternal.returns(true);
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postSingleTotal(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getQuantities', () => {
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      const request = createRequest();

      await controller.getQuantities(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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
      forms.getValues.returns(returnLines);

      const request = createRequest();

      await controller.postQuantities(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_QUANTITIES, request);

      expect(getNextPathCalled).to.be.true();
    });
    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postQuantities(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getConfirm', () => {
    test('it should render nunjucks/returns/confirm.njk with returns data', async () => {
      const request = createRequest();

      await controller.getConfirm(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/confirm.njk');
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
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      const request = createRequest();

      await controller.getMeterDetails(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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
    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterDetails(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getMeterUnits', () => {
    test('it should render nunjucks/returns/form.njk with returns data', async () => {
      const request = createRequest();

      await controller.getMeterUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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
    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterUnits(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
    });
  });

  experiment('getMeterReset', () => {
    test('it should render nunjucks/returns/form.njk page with returns data', async () => {
      const request = createRequest();

      await controller.getMeterReset(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/meter-reset.njk');
      expect(view.return).to.equal(request.returns.data);
    });
    test('it should call getPreviousPath with STEP_METER_RESET, request and request.returns.data', async () => {
      const request = createRequest();

      await controller.getMeterReset(request, h);
      const getPreviousPathCalled = flowHelpers.getPreviousPath.calledWith(flowHelpers.STEP_METER_RESET, request, request.returns.data);

      expect(getPreviousPathCalled).to.be.true();
    });
  });

  experiment('postMeterReset', () => {
    test('it should call getNextPath with STEP_METER_RESET, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ units: 'm³' });

      const request = createRequest();

      await controller.postMeterReset(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METER_RESET, request);

      expect(getNextPathCalled).to.be.true();
    });

    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterReset(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/meter-reset.njk');
      expect(view.return).to.equal(request.returns.data);
      expect(view.back).to.startWith('/return/method?returnId=');
    });
  });

  experiment('getMeterReadings', () => {
    test('it should render nunjucks/returns/form.njk page with returns data', async () => {
      const request = createRequest();

      await controller.getMeterReadings(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
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

    test('it should render same page if form is not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest();

      await controller.postMeterReadings(request, h);
      const [template, view] = h.view.lastCall.args;

      expect(template).to.equal('nunjucks/returns/form.njk');
      expect(view.return).to.equal(request.returns.data);
      expect(view.back).to.startWith('/return/units?returnId');
    });
  });

  experiment('getMeterUsed', () => {
    beforeEach(async () => {
      permissions.isInternal.returns(true);
    });

    test('it should use correct template', async () => {
      const request = createRequest(true);
      await controller.getMeterUsed(request, h);
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('water/returns/internal/form');
    });

    test('is should provide data to view', async () => {
      const request = createRequest(true);
      await controller.getMeterUsed(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.back).to.be.a.string();
      expect(view.form).to.be.an.object();
      expect(view.return).to.be.an.object();
    });
  });

  experiment('postMeterUsed', () => {
    beforeEach(async () => {
      permissions.isInternal.returns(true);
    });

    test('it should re-render page if form not valid', async () => {
      forms.handleRequest.returns({ isValid: false });
      const request = createRequest(true);
      await controller.postMeterUsed(request, h);
      const [template, view] = h.view.lastCall.args;
      expect(template).to.equal('water/returns/internal/form');
      expect(view.back).to.startWith('/admin/return/meter/details-provided?returnId=');
    });

    test('it should call getNextPath with STEP_METER_USED, request', async () => {
      forms.handleRequest.returns({ isValid: true });
      forms.getValues.returns({ meterUsed: true });
      const request = createRequest(true);
      await controller.postMeterUsed(request, h);
      const getNextPathCalled = flowHelpers.getNextPath.calledWith(flowHelpers.STEP_METER_USED, request);

      expect(getNextPathCalled).to.be.true();
    });
  });
});
