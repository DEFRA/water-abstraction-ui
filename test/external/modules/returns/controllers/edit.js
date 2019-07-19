const { experiment, test, beforeEach, afterEach } = exports.lab = require('lab').script();
const { expect } = require('code');
const sandbox = require('sinon').createSandbox();
const controller = require('external/modules/returns/controllers/edit');
const forms = require('shared/lib/forms');

const { STEP_RETURNS, STEP_METHOD, STEP_METER_RESET, STEP_UNITS,
  STEP_QUANTITIES, STEP_METER_READINGS, STEP_METER_DETAILS, STEP_CONFIRM
} = require('shared/modules/returns/steps');

const csrfToken = '3d44ea7a-2cc0-455f-84c9-ee2c33b3470e';
const returnId = 'v1:1:123/456:1234:2018-04-01:2019-03-30';

let reading = {
  isOneMeter: sandbox.stub(),
  setMethod: sandbox.stub(),
  setReadingType: sandbox.stub(),
  setUnits: sandbox.stub(),
  isVolumes: sandbox.stub(),
  isMeasured: sandbox.stub()
};

reading.setMethod.returns(reading);

const createRequest = (isValid = true) => ({
  query: {
    returnId
  },
  view: {
    form: {
      isValid
    },
    csrfToken
  },
  model: {
    setNilReturn: sandbox.stub(),
    isNilReturn: sandbox.stub(),
    reading,
    setLines: sandbox.stub(),
    meter: {
      setMeterDetails: sandbox.stub()
    }
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
  });

  afterEach(async () => {
    sandbox.restore();
  });

  const testFormIsRendered = () => test('renders the correct template', async () => {
    const [template, , options] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/returns/form.njk');
    expect(options).to.equal({ layout: false });
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
      expect(reading.setMethod.calledWith('oneMeter')).to.equal(true);
      expect(reading.setReadingType.calledWith('measured')).to.equal(true);
    });

    test('user is redirected to meter reset page if meter readings', async () => {
      reading.isOneMeter.returns(true);
      await controller.postMethod(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_RESET}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('user is redirected to units page if volumes', async () => {
      reading.isOneMeter.returns(false);
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
      expect(reading.setUnits.calledWith('l')).to.equal(true);
    });

    test('user is redirected to quantites page if volumes', async () => {
      reading.isVolumes.returns(true);
      await controller.postUnits(request, h);
      expect(h.redirect.calledWith(`${STEP_QUANTITIES}?returnId=${returnId}`))
        .to.equal(true);
    });

    test('user is redirected to meter readings page if meter readings', async () => {
      reading.isVolumes.returns(false);
      await controller.postUnits(request, h);
      expect(h.redirect.calledWith(`${STEP_METER_READINGS}?returnId=${returnId}`))
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
      const [lines] = request.model.setLines.lastCall.args;
      expect(lines).to.equal([
        { startDate: '2019-01-01', endDate: '2019-01-31', quantity: 2 },
        { startDate: '2019-02-01', endDate: '2019-02-28', quantity: 10 }
      ]);
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
        await controller.postUnits(request, h);
      });

      testFormIsRendered();
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
        await controller.postUnits(request, h);
      });

      testFormIsRendered();
    });
  });
});
