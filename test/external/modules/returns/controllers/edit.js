const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const { URL } = require('url');
const controller = require('external/modules/returns/controllers/edit');
const forms = require('shared/lib/forms');
const services = require('external/lib/connectors/services');

const { STEP_START, STEP_RETURNS, STEP_METHOD, STEP_METER_RESET, STEP_UNITS,
  STEP_QUANTITIES, STEP_METER_READINGS, STEP_METER_DETAILS, STEP_CONFIRM,
  STEP_SUBMITTED
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
    isMeasured: sandbox.stub()
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
      setMeterReadings: sandbox.stub()
    },
    getLines: sandbox.stub().returns(lines),
    getReturnTotal: sandbox.stub().returns(999),
    setUser: sandbox.stub(),
    setStatus: sandbox.stub(),
    setReceivedDate: sandbox.stub(),
    incrementVersionNumber: sandbox.stub()
  };
  model.setUser.returns(model);
  model.setStatus.returns(model);
  model.setReceivedDate.returns(model);
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
  model: createModel(),
  yar: {
    set: sandbox.stub(),
    get: sandbox.stub(),
    clear: sandbox.stub()
  }
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

  const testRedirect = step => test('redirects to the correct URL', async () => {
    const [path] = h.redirect.lastCall.args;

    const url = new URL(path, 'http://localhost:8000');

    expect(url.searchParams.get('error')).to.be.a.string().length(36);
    expect(url.searchParams.get('returnId')).to.equal(returnId);
    expect(url.pathname).to.equal(step);
  });

  experiment('getAmounts', () => {
    beforeEach(async () => {
      await controller.getAmounts(createRequest(), h);
    });

    testFormIsRendered();

    test('back link is to returns page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(STEP_RETURNS);
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

      testRedirect(STEP_START);
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

    test('back link is to meter reset page if meter readings', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.getMethod(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_RESET}?returnId=${returnId}`);
    });

    test('back link is to units page if volumes', async () => {
      request.model.reading.isOneMeter.returns(false);
      await controller.getMethod(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_UNITS}?returnId=${returnId}`);
    });
  });

  experiment('postMethod', () => {
    let request;

    beforeEach(async () => {
      request = createRequest(true);
      forms.getValues.returns({ method: 'oneMeter,measured' });
    });

    test('updates the method and reading type on the reading model', async () => {
      await controller.postMethod(request, h);
      expect(request.model.reading.setMethod.calledWith('oneMeter')).to.equal(true);
      expect(request.model.reading.setReadingType.calledWith('measured')).to.equal(true);
    });

    test('user is redirected to meter reset page if meter readings', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.postMethod(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_RESET}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('user is redirected to units page if volumes', async () => {
      request.model.reading.isOneMeter.returns(false);
      await controller.postMethod(request, h);
      expect(h.redirect.calledWith(`${STEP_UNITS}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postMethod(request, h);
      });

      testRedirect(STEP_METHOD);
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

    test('back link is to meter reset page if meter readings', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.getUnits(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_RESET}?returnId=${returnId}`);
    });

    test('back link is to method page if volumes', async () => {
      request.model.reading.isOneMeter.returns(false);
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

    test('user is redirected to quantites page if volumes', async () => {
      request.model.reading.isVolumes.returns(true);
      await controller.postUnits(request, h);
      expect(h.redirect.calledWith(`${STEP_QUANTITIES}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('user is redirected to meter readings page if meter readings', async () => {
      request.model.reading.isVolumes.returns(false);
      await controller.postUnits(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_READINGS}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postUnits(request, h);
      });

      testRedirect(STEP_UNITS);
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

    test('back link is to units page', async () => {
      await controller.getQuantities(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_UNITS}?returnId=${returnId}`);
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

    test('redirects to meter details if reading type is measured', async () => {
      request.model.reading.isMeasured.returns(true);
      await controller.postQuantities(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_DETAILS}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('redirects to confirmation page if estimates', async () => {
      request.model.reading.isMeasured.returns(false);
      await controller.postQuantities(request, h);
      expect(h.redirect.calledWith(`${STEP_CONFIRM}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postQuantities(request, h);
      });

      testRedirect(STEP_QUANTITIES);
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

    test('back link is to units page when meter readings', async () => {
      request.model.reading.isOneMeter.returns(true);
      await controller.getMeterDetails(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METER_READINGS}?returnId=${returnId}`);
    });

    test('back link is to quantities page when volumes', async () => {
      request.model.reading.isOneMeter.returns(false);
      await controller.getMeterDetails(request, h);
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_QUANTITIES}?returnId=${returnId}`);
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

    test('redirects to confirmation page', async () => {
      await controller.postMeterDetails(request, h);
      expect(h.redirect.calledWith(`${STEP_CONFIRM}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postMeterDetails(request, h);
      });

      testRedirect(STEP_METER_DETAILS);
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

      test('make change text is "Edit your meter readings"', async () => {
        const [, { makeChangeText }] = h.view.lastCall.args;
        expect(makeChangeText).to.equal('Edit your meter readings');
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

      test('make change text is "Edit your meter volumes"', async () => {
        const [, { makeChangeText }] = h.view.lastCall.args;
        expect(makeChangeText).to.equal('Edit your volumes');
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
      controller.postConfirm(request, h);
    });

    test('sets the user on the return model', async () => {
      expect(request.model.setUser.calledWith(
        request.defra.userName,
        request.defra.entityId,
        false
      )).to.equal(true);
    });

    test('sets status to completed on the return model', async () => {
      expect(request.model.setStatus.calledWith(
        'completed'
      )).to.equal(true);
    });

    test('calls incrementVersionNumber() on the return model', async () => {
      expect(request.model.incrementVersionNumber.callCount).to.equal(1);
    });

    test('redirects to submitted page', async () => {
      expect(h.redirect.calledWith(`${STEP_SUBMITTED}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postConfirm(request, h);
      });

      testRedirect(STEP_CONFIRM);
    });
  });

  experiment('getMeterReset', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getMeterReset(request, h);
    });

    testFormIsRendered();

    test('back link is to method page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_METHOD}?returnId=${returnId}`);
    });
  });

  experiment('postMeterReset', () => {
    let request;
    beforeEach(async () => {
      request = createRequest();
    });

    experiment('when meter reset', () => {
      beforeEach(async () => {
        forms.getValues.returns({ meterReset: true });
        await controller.postMeterReset(request, h);
      });

      test('sets method to volumes', async () => {
        expect(
          request.model.reading.setMethod.calledWith('abstractionVolumes')
        ).to.equal(true);
      });

      test('redirects to units page', async () => {
        expect(h.redirect.calledWith(`${STEP_UNITS}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when meter did not reset', () => {
      beforeEach(async () => {
        forms.getValues.returns({ meterReset: false });
        await controller.postMeterReset(request, h);
      });

      test('sets method to meter readings', async () => {
        expect(
          request.model.reading.setMethod.calledWith('oneMeter')
        ).to.equal(true);
      });

      test('redirects to units page', async () => {
        expect(h.redirect.calledWith(`${STEP_UNITS}?returnId=${returnId}`))
          .to.equal(true);
      });
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postMeterReset(request, h);
      });

      testRedirect(STEP_METER_RESET);
    });
  });

  experiment('getMeterReadings', () => {
    beforeEach(async () => {
      const request = createRequest();
      await controller.getMeterReadings(request, h);
    });

    testFormIsRendered();

    test('back link is to units page', async () => {
      const [, { back }] = h.view.lastCall.args;
      expect(back).to.equal(`${STEP_UNITS}?returnId=${returnId}`);
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

    test('redirects to the meter details page', async () => {
      expect(h.redirect.calledWith(`${STEP_METER_DETAILS}?returnId=${returnId}`))
        .to.equal(true);
    });

    experiment('when form is invalid', async () => {
      beforeEach(async () => {
        const request = createRequest(false);
        await controller.postMeterReadings(request, h);
      });

      testRedirect(STEP_METER_READINGS);
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
