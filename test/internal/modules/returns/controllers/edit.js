const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const moment = require('moment');
const sandbox = require('sinon').createSandbox();
const controller = require('internal/modules/returns/controllers/edit');
const forms = require('shared/lib/forms');
const services = require('internal/lib/connectors/services');

const { STEP_START, STEP_METHOD, STEP_UNITS,
  STEP_QUANTITIES, STEP_METER_READINGS, STEP_METER_DETAILS, STEP_CONFIRM,
  STEP_SUBMITTED, STEP_INTERNAL_ROUTING, STEP_DATE_RECEIVED,
  STEP_METER_DETAILS_PROVIDED, STEP_METER_USED, STEP_SINGLE_TOTAL,
  STEP_SINGLE_TOTAL_DATES
} = require('shared/modules/returns/steps');

const csrfToken = '3d44ea7a-2cc0-455f-84c9-ee2c33b3470e';
const returnId = 'v1:1:123/456:1234:2018-04-01:2019-03-30';

const waterResponse = {
  returnId
};

const lines = [
  { startDate: '2019-01-01', endDate: '2019-01-31', quantity: 2 },
  { startDate: '2019-02-01', endDate: '2019-02-28', quantity: 10 }
];

const createModel = () => {
  let reading = {
    isOneMeter: sandbox.stub(),
    setMethod: sandbox.stub(),
    setReadingType: sandbox.stub(),
    setUnits: sandbox.stub(),
    isVolumes: sandbox.stub(),
    isMeasured: sandbox.stub(),
    setSingleTotal: sandbox.stub(),
    setCustomAbstractionPeriod: sandbox.stub(),
    isSingleTotal: sandbox.stub()
  };
  reading.setMethod.returns(reading);

  let model = {
    setNilReturn: sandbox.stub(),
    isNilReturn: sandbox.stub(),
    reading,
    setLines: sandbox.stub(),
    meter: {
      setMeterDetails: sandbox.stub(),
      getEndReading: sandbox.stub().returns(55),
      setMeterReadings: sandbox.stub(),
      setMeterDetailsProvided: sandbox.stub(),
      isMeterDetailsProvided: sandbox.stub()
    },
    getLines: sandbox.stub().returns(lines),
    getReturnTotal: sandbox.stub().returns(999),
    setUser: sandbox.stub(),
    setStatus: sandbox.stub(),
    setReceivedDate: sandbox.stub(),
    incrementVersionNumber: sandbox.stub(),
    updateSingleTotalLines: sandbox.stub(),
    setUnderQuery: sandbox.stub()
  };
  model.setUser.returns(model);
  model.setStatus.returns(model);
  model.setReceivedDate.returns(model);
  model.setUnderQuery.returns(model);
  return model;
};

const createRequest = (isValid = true) => ({
  defra: {
    userName: 'bob@example.com',
    entityId: 'entity-1'
  },
  query: {
    returnId
  },
  view: {
    form: {
      isValid
    },
    csrfToken
  },
  model: createModel()
});

experiment('returns edit controller: ', () => {
  let h;

  beforeEach(async () => {
    h = {
      redirect: sandbox.stub(),
      view: sandbox.stub()
    };
    sandbox.stub(forms, 'getValues').returns({});
    sandbox.stub(services.water.returns, 'getReturn').resolves(waterResponse);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const testFormIsRendered = () => test('renders the correct template', async () => {
    const [template, , options] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/returns/form.njk');
    expect(options).to.equal({ layout: false });
  });

  experiment('getDateReceived', () => {
    beforeEach(async () => {
      await controller.getDateReceived(createRequest(), h);
    });

    testFormIsRendered();

    test('back link is to internal routing page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_INTERNAL_ROUTING}?returnId=${returnId}`);
    });
  });

  experiment('postDateReceived', () => {
    let request;

    experiment('when form is valid', () => {
      beforeEach(async () => {
        request = createRequest();
        forms.getValues.returns({
          receivedDate: 'today'
        });
      });

      test('sets received date to today', async () => {
        await controller.postDateReceived(request, h);
        const today = moment().format('YYYY-MM-DD');
        expect(
          request.model.setReceivedDate.calledWith(today)
        ).to.equal(true);
      });

      test('sets received date to yesterday', async () => {
        forms.getValues.returns({
          receivedDate: 'yesterday'
        });
        await controller.postDateReceived(request, h);
        const yesterday = moment().subtract(1, 'day').format('YYYY-MM-DD');
        expect(
          request.model.setReceivedDate.calledWith(yesterday)
        ).to.equal(true);
      });

      test('sets received date to custom value', async () => {
        forms.getValues.returns({
          receivedDate: 'custom',
          customDate: '2019-02-14'
        });
        await controller.postDateReceived(request, h);
        expect(
          request.model.setReceivedDate.calledWith('2019-02-14')
        ).to.equal(true);
      });

      test('redirects to nil return page', async () => {
        await controller.postDateReceived(request, h);
        expect(
          h.redirect.calledWith(`${STEP_START}?returnId=${returnId}`)
        ).to.equal(true);
      });
    });

    experiment('when form is invalid', () => {
      beforeEach(async () => {
        request = createRequest(false);
        await controller.postDateReceived(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getAmounts', () => {
    beforeEach(async () => {
      await controller.getAmounts(createRequest(), h);
    });

    testFormIsRendered();

    test('back link is to date received page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_DATE_RECEIVED}?returnId=${returnId}`);
    });
  });

  experiment('postAmounts', () => {
    experiment('when nil return is true', async () => {
      let request;
      beforeEach(async () => {
        request = createRequest();
        request.model.isNilReturn.returns(true);
        forms.getValues.returns({
          isNil: true
        });
        await controller.postAmounts(request, h);
      });

      test('model is updated', async () => {
        expect(request.model.setNilReturn.calledWith(true)).to.equal(true);
      });

      test('user is redirected to confirmation page', async () => {
        expect(h.redirect.calledWith(`${STEP_CONFIRM}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when nil return is false', async () => {
      let request;
      beforeEach(async () => {
        request = createRequest();
        request.model.isNilReturn.returns(false);
        forms.getValues.returns({
          isNil: false
        });
        await controller.postAmounts(request, h);
      });

      test('model is updated', async () => {
        expect(request.model.setNilReturn.calledWith(false)).to.equal(true);
      });

      test('user is redirected to method page', async () => {
        expect(h.redirect.calledWith(`${STEP_METHOD}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postAmounts(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getMethod', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getMethod(request, h);
      });

      testFormIsRendered();
    });

    test('back link is to nil return page', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.getMethod(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_START}?returnId=${returnId}`);
    });
  });

  experiment('postMethod', () => {
    let request;

    beforeEach(async () => {
      request = createRequest(true);
      forms.getValues.returns({ method: 'oneMeter' });
    });

    test('updates the method on the reading model', async () => {
      await controller.postMethod(request, h);
      expect(request.model.reading.setMethod.calledWith('oneMeter')).to.equal(true);
    });

    test('user is redirected to units page', async () => {
      await controller.postMethod(request, h);
      expect(h.redirect.calledWith(`${STEP_UNITS}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postMethod(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getUnits', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getUnits(request, h);
      });

      testFormIsRendered();
    });

    test('back link is to method page', async () => {
      await controller.getUnits(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METHOD}?returnId=${returnId}`);
    });
  });

  experiment('postUnits', () => {
    let request;

    beforeEach(async () => {
      request = createRequest(true);
      forms.getValues.returns({ units: 'l' });
    });

    test('updates the units on the reading model', async () => {
      await controller.postUnits(request, h);
      expect(request.model.reading.setUnits.calledWith('l')).to.equal(true);
    });

    test('user is redirected to meter details provided page', async () => {
      await controller.postUnits(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_DETAILS_PROVIDED}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postUnits(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getMeterDetailsProvided', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getMeterDetailsProvided(request, h);
    });

    test('back link is to units page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_UNITS}?returnId=${returnId}`);
    });

    testFormIsRendered();
  });

  experiment('postMeterDetailsProvided', () => {
    let request;

    experiment('when form is valid', async () => {
      beforeEach(async () => {
        request = createRequest();
      });

      test('calls setMeterDetailsProvided on meter model', async () => {
        forms.getValues.returns({
          meterDetailsProvided: true
        });
        await controller.postMeterDetailsProvided(request, h);
        expect(
          request.model.meter.setMeterDetailsProvided.calledWith(true)
        ).to.equal(true);
      });

      test('redirects to meter details if meter details provided', async () => {
        forms.getValues.returns({
          meterDetailsProvided: true
        });
        await controller.postMeterDetailsProvided(request, h);
        expect(h.redirect.calledWith(`${STEP_METER_DETAILS}?returnId=${returnId}`))
          .to.equal(true);
      });

      test('redirects to meter used if volumes and meter details not provided', async () => {
        forms.getValues.returns({
          meterDetailsProvided: false
        });
        request.model.reading.isVolumes.returns(true);
        await controller.postMeterDetailsProvided(request, h);
        expect(h.redirect.calledWith(`${STEP_METER_USED}?returnId=${returnId}`))
          .to.equal(true);
      });

      test('redirects to meter readings if meter readings and meter details not provided', async () => {
        forms.getValues.returns({
          meterDetailsProvided: false
        });
        request.model.reading.isVolumes.returns(false);
        await controller.postMeterDetailsProvided(request, h);
        expect(h.redirect.calledWith(`${STEP_METER_READINGS}?returnId=${returnId}`))
          .to.equal(true);
      });
    });
  });

  experiment('getMeterDetails', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getMeterDetails(request, h);
      });

      testFormIsRendered();
    });

    test('back link is to meter details provided page', async () => {
      await controller.getMeterDetails(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS_PROVIDED}?returnId=${returnId}`);
    });
  });

  experiment('postMeterDetails', () => {
    let request;
    const manufacturer = 'Pump-u-like';
    const serialNumber = '01234';

    beforeEach(async () => {
      request = createRequest(true);
      forms.getValues.returns({
        csrf_token: csrfToken,
        manufacturer,
        serialNumber
      });
    });

    test('updates the meter model with 1x multiplication', async () => {
      await controller.postMeterDetails(request, h);
      const [meter] = request.model.meter.setMeterDetails.lastCall.args;
      expect(meter).to.equal({
        manufacturer,
        serialNumber,
        multiplier: 1
      });
    });

    test('updates the meter model with 10x multiplication', async () => {
      forms.getValues.returns({
        csrf_token: csrfToken,
        manufacturer,
        serialNumber,
        isMultiplier: ['multiply']
      });
      await controller.postMeterDetails(request, h);
      const [meter] = request.model.meter.setMeterDetails.lastCall.args;
      expect(meter).to.equal({
        manufacturer,
        serialNumber,
        multiplier: 10
      });
    });

    test('redirects to meter readings page if meter readings', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.postMeterDetails(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_READINGS}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('redirects to single total page if volumes', async () => {
      request.model.reading.isOneMeter.returns(false);
      await controller.postMeterDetails(request, h);
      expect(h.redirect.calledWith(`${STEP_SINGLE_TOTAL}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postUnits(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getMeterUsed', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getMeterUsed(request, h);
    });

    test('back link is to meter details provided page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS_PROVIDED}?returnId=${returnId}`);
    });

    testFormIsRendered();
  });

  experiment('postMeterUsed', () => {
    let request;
    experiment('when the form is valid', () => {
      beforeEach(async () => {
        request = createRequest();
      });

      test('sets reading type to estimates if a meter was not used', async () => {
        forms.getValues.returns({ meterUsed: false });
        await controller.postMeterUsed(request, h);
        expect(
          request.model.reading.setReadingType.calledWith('estimated')
        ).to.equal(true);
      });

      test('sets reading type to measured if a meter was used', async () => {
        forms.getValues.returns({ meterUsed: true });
        await controller.postMeterUsed(request, h);
        expect(
          request.model.reading.setReadingType.calledWith('measured')
        ).to.equal(true);
      });

      test('redirects to single total page', async () => {
        await controller.postMeterUsed(request, h);
        expect(h.redirect.calledWith(`${STEP_SINGLE_TOTAL}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when form is not valid', () => {
      beforeEach(async () => {
        request = createRequest(false);
        await controller.postMeterUsed(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getMeterReadings', () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
      request.model.meter.isMeterDetailsProvided.returns(true);
      await controller.getMeterReadings(request, h);
    });

    testFormIsRendered();

    test('back link is to meter details page if meter details provided', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS}?returnId=${returnId}`);
    });

    test('back link is to meter details provided page if meter details not provided', async () => {
      request.model.meter.isMeterDetailsProvided.returns(false);
      await controller.getMeterReadings(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS_PROVIDED}?returnId=${returnId}`);
    });
  });

  experiment('postMeterReadings', async () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
      forms.getValues.returns({
        csrf_token: request.view.csrfToken,
        startReading: 10,
        '2019-01-01_2019-01-31': 2,
        '2019-02-01_2019-02-28': 10
      });
      await controller.postMeterReadings(request, h);
    });

    test('sets meter start reading and readings on the meter model', async () => {
      const readingLines = [{
        startDate: '2019-01-01',
        endDate: '2019-01-31',
        reading: 2
      }, {
        startDate: '2019-02-01',
        endDate: '2019-02-28',
        reading: 10
      }];
      expect(
        request.model.meter.setMeterReadings.calledWith(10, readingLines)
      ).to.equal(true);
    });

    test('redirects to the confirmation page', async () => {
      expect(h.redirect.calledWith(`${STEP_CONFIRM}?returnId=${returnId}`))
        .to.equal(true);
    });
  });

  experiment('getSingleTotal', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getSingleTotal(request, h);
      });

      testFormIsRendered();
    });

    test('back link is to meter details page if meter details provided', async () => {
      request.model.meter.isMeterDetailsProvided.returns(true);
      await controller.getSingleTotal(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS}?returnId=${returnId}`);
    });

    test('back link is to meter used page if meter details not provided', async () => {
      request.model.meter.isMeterDetailsProvided.returns(false);
      await controller.getSingleTotal(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_USED}?returnId=${returnId}`);
    });
  });

  experiment('postSingleTotal', () => {
    let request;
    experiment('when single total is true', async () => {
      beforeEach(async () => {
        request = createRequest();
        forms.getValues.returns({
          isSingleTotal: true,
          total: 100
        });
        await controller.postSingleTotal(request, h);
      });

      test('reading model is updated', async () => {
        expect(
          request.model.reading.setSingleTotal.calledWith(true, 100)
        ).to.equal(true);
      });

      test('redirects to single total dates page', async () => {
        expect(h.redirect.calledWith(`${STEP_SINGLE_TOTAL_DATES}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when single total is false', async () => {
      beforeEach(async () => {
        request = createRequest();
        forms.getValues.returns({
          isSingleTotal: false,
          total: 100
        });
        await controller.postSingleTotal(request, h);
      });

      test('reading model is updated', async () => {
        expect(
          request.model.reading.setSingleTotal.calledWith(false, 100)
        ).to.equal(true);
      });

      test('redirects to quantities page', async () => {
        expect(h.redirect.calledWith(`${STEP_QUANTITIES}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        request = createRequest(false);
        await controller.postSingleTotal(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getSingleTotalDates', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getSingleTotalDates(request, h);
      });

      testFormIsRendered();
    });

    test('back link is to single total page', async () => {
      await controller.getSingleTotalDates(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_SINGLE_TOTAL}?returnId=${returnId}`);
    });
  });

  experiment('postSingleTotalDates', () => {
    let request;

    experiment('when form is valid', () => {
      beforeEach(async () => {
        request = createRequest();
        forms.getValues.returns({
          totalCustomDates: true,
          totalCustomDateStart: '2018-04-01',
          totalCustomDateEnd: '2018-04-30'
        });
        await controller.postSingleTotalDates(request, h);
      });

      test('the reading model is updated', async () => {
        expect(
          request.model.reading.setCustomAbstractionPeriod.calledWith(
            true, '2018-04-01', '2018-04-30'
          )
        ).to.equal(true);
      });

      test('the lines are recalculated from the single total', async () => {
        expect(
          request.model.updateSingleTotalLines.callCount
        ).to.equal(1);
      });

      test('redirects to quantities page', async () => {
        await controller.postSingleTotalDates(request, h);
        expect(h.redirect.calledWith(`${STEP_QUANTITIES}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when the form is invalid', () => {
      beforeEach(async () => {
        request = createRequest(false);
        await controller.postSingleTotalDates(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getQuantities', () => {
    let request;

    beforeEach(async () => {
      request = createRequest();
    });

    experiment('renders form template', () => {
      beforeEach(async () => {
        await controller.getQuantities(request, h);
      });

      testFormIsRendered();
    });

    test('back link is single total dates if single total', async () => {
      request.model.reading.isSingleTotal.returns(true);
      await controller.getQuantities(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_SINGLE_TOTAL_DATES}?returnId=${returnId}`);
    });

    test('back link is single total if not single total', async () => {
      request.model.reading.isSingleTotal.returns(false);
      await controller.getQuantities(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_SINGLE_TOTAL}?returnId=${returnId}`);
    });
  });

  experiment('postQuantities', () => {
    let request;

    beforeEach(async () => {
      request = createRequest(true);
      forms.getValues.returns({
        csrf_token: csrfToken,
        '2019-01-01_2019-01-31': 2,
        '2019-02-01_2019-02-28': 10
      });
    });

    test('maps and updates the data on the lines model', async () => {
      await controller.postQuantities(request, h);
      const [meterLines] = request.model.setLines.lastCall.args;
      expect(meterLines).to.equal(lines);
    });

    test('redirects to confirmation page', async () => {
      await controller.postQuantities(request, h);
      expect(h.redirect.calledWith(`${STEP_CONFIRM}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postUnits(request, h);
      });

      testFormIsRendered();
    });
  });

  experiment('getConfirm', () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
    });

    test('sets data in the view', async () => {
      await controller.getConfirm(request, h);
      const [, view] = h.view.lastCall.args;
      expect(view.lines).to.equal(lines);
      expect(view.back).to.be.a.string();
      expect(view.total).to.equal(999);
      expect(view.endReading).to.equal(55);
    });

    test('back link is to start of flow if nil return', async () => {
      request.model.isNilReturn.returns(true);
      await controller.getConfirm(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_START}?returnId=${returnId}`);
    });

    test('back link is meter details if measured', async () => {
      request.model.reading.isMeasured.returns(true);
      await controller.getConfirm(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_DETAILS}?returnId=${returnId}`);
    });

    test('back link is quantities if estimates', async () => {
      request.model.reading.isMeasured.returns(false);
      await controller.getConfirm(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_QUANTITIES}?returnId=${returnId}`);
    });

    experiment('for meter readings', async () => {
      beforeEach(async () => {
        request.model.reading.isOneMeter.returns(true);
        await controller.getConfirm(request, h);
      });

      test('make change text is "Edit these meter readings"', async () => {
        const [, { makeChangeText }] = h.view.lastCall.args;
        expect(makeChangeText).to.equal('Edit these meter readings');
      });

      test('make change link leads to meter readings page', async () => {
        const [, { makeChangePath }] = h.view.lastCall.args;
        expect(makeChangePath).to.equal(`${STEP_METER_READINGS}?returnId=${returnId}`);
      });
    });

    experiment('for volumes', async () => {
      beforeEach(async () => {
        request.model.reading.isOneMeter.returns(false);
        await controller.getConfirm(request, h);
      });

      test('make change text is "Edit these meter volumes"', async () => {
        const [, { makeChangeText }] = h.view.lastCall.args;
        expect(makeChangeText).to.equal('Edit these volumes');
      });

      test('make change link leads to quantities page', async () => {
        const [, { makeChangePath }] = h.view.lastCall.args;
        expect(makeChangePath).to.equal(`${STEP_QUANTITIES}?returnId=${returnId}`);
      });
    });
  });

  experiment('postConfirm', async () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
      await controller.postConfirm(request, h);
    });

    test('sets the user with internal flag on the return model', async () => {
      expect(request.model.setUser.calledWith(
        request.defra.userName,
        request.defra.entityId,
        true
      )).to.equal(true);
    });

    test('sets status to completed on the return model', async () => {
      expect(request.model.setStatus.calledWith(
        'completed'
      )).to.equal(true);
    });

    experiment('when under query not checked', () => {
      beforeEach(async () => {
        forms.getValues.returns({
          isUnderQuery: undefined
        });
        await controller.postConfirm(request, h);
      });
      test('under query is set to false', async () => {
        expect(request.model.setUnderQuery.calledWith(
          false
        )).to.equal(true);
      });
    });

    experiment('when under query checked', () => {
      beforeEach(async () => {
        forms.getValues.returns({
          isUnderQuery: ['under_query']
        });
        await controller.postConfirm(request, h);
      });
      test('under query is set to true', async () => {
        expect(request.model.setUnderQuery.calledWith(
          true
        )).to.equal(true);
      });
    });

    test('calls incrementVersionNumber() on the return model', async () => {
      expect(request.model.incrementVersionNumber.callCount).to.equal(1);
    });

    test('redirects to submitted page', async () => {
      expect(h.redirect.calledWith(`${STEP_SUBMITTED}?returnId=${returnId}`))
        .to.equal(true);
    });
  });

  experiment('getSubmitted', () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
      await controller.getSubmitted(request, h);
    });

    test('renders correct template', async () => {
      const [template] = h.view.lastCall.args;
      expect(template).to.equal('nunjucks/returns/submitted.njk');
    });

    test('sets view return URL in view', async () => {
      const [, { returnUrl }] = h.view.lastCall.args;
      expect(returnUrl).to.equal(`/returns/return?id=${returnId}`);
    });

    test('sets return data from water service in view', async () => {
      const [, { data }] = h.view.lastCall.args;
      expect(data).to.equal(waterResponse);
    });

    test('sets page title', async () => {
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Abstraction return - submitted');
    });

    test('sets special page title for nil return submitted', async () => {
      services.water.returns.getReturn.resolves({
        returnId,
        isNil: true
      });
      await controller.getSubmitted(request, h);
      const [, { pageTitle }] = h.view.lastCall.args;
      expect(pageTitle).to.equal('Abstraction return - nil submitted');
    });
  });
});
