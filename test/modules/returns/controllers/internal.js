const { expect } = require('code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('lab').script();

const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const waterConnector = require('../../../../src/lib/connectors/water');
const helpers = require('../../../../src/modules/returns/lib/helpers');
const controller = require('../../../../src/modules/returns/controllers/internal');
const sessionHelpers = require('../../../../src/modules/returns/lib/session-helpers');

experiment('internal returns controller', () => {
  beforeEach(async () => {
    sandbox.stub(sessionHelpers, 'saveSessionData');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getDateReceived', () => {
    let h;
    let request;

    beforeEach(async () => {
      sandbox.stub(waterConnector.returns, 'getReturn').resolves({});
      sandbox.stub(helpers, 'getViewData').resolves({});
      request = {
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        }
      };

      h = {
        view: sinon.stub()
      };

      await controller.getDateReceived(request, h);
    });

    test('uses the default form view', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('water/returns/internal/form');
    });

    test('back is set to the correct previous page', async () => {
      const [, data] = h.view.lastCall.args;
      expect(data.back).to.equal('/admin/return/internal?returnId=test-return-id');
    });
  });

  experiment('postDateReceived', () => {
    let h;
    let request;

    beforeEach(async () => {
      sandbox.stub(waterConnector.returns, 'getReturn').resolves({});
      sandbox.stub(helpers, 'getViewData').resolves({});
      request = {
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        },
        payload: {
          csrf_token: 'test',
          'receivedDate-year': '2018',
          'receivedDate-month': '11',
          'receivedDate-day': '22'
        }
      };

      h = {
        view: sinon.stub(),
        redirect: sinon.stub()
      };
    });

    experiment('for a valid request', () => {
      beforeEach(async () => {
        await controller.postDateReceived(request, h);
      });

      test('the expected data is saved to session', async () => {
        const [, data] = sessionHelpers.saveSessionData.lastCall.args;
        expect(data.receivedDate).to.equal('2018-11-22');
      });

      test('user is redirected to the next step', async () => {
        const [redirectUrl] = h.redirect.lastCall.args;
        expect(redirectUrl).to.equal('/admin/return?returnId=test-return-id');
      });
    });

    experiment('for an invalid request', () => {
      beforeEach(async () => {
        request.payload['receivedDate-day'] = '';
        await controller.postDateReceived(request, h);
      });

      test('the data is not saved to session', async () => {
        expect(sessionHelpers.saveSessionData.called).to.be.false();
      });

      test('the view is shown again', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('water/returns/internal/form');
      });
    });
  });

  experiment('getInternalMethod', () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {},
          view: {}
        },
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        }
      };

      h = {
        view: sandbox.stub()
      };

      await controller.getInternalMethod(request, h);
    });

    test('uses the default form view', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('water/returns/internal/form');
    });

    test('back is set to the correct previous page', async () => {
      const [, data] = h.view.lastCall.args;
      expect(data.back).to.equal('/admin/return?returnId=test-return-id');
    });
  });

  experiment('postInternalMethod', () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {},
          view: {}
        },
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        },
        payload: {
          method: 'abstractionVolumes',
          csrf_token: 'test'
        }
      };

      h = {
        view: sandbox.stub(),
        redirect: sandbox.stub()
      };
    });

    experiment('for a valid request', () => {
      beforeEach(async () => {
        await controller.postInternalMethod(request, h);
      });

      test('the expected data is saved to session', async () => {
        const [, data] = sessionHelpers.saveSessionData.lastCall.args;
        expect(data.reading.method).to.equal('abstractionVolumes');
      });

      test('user is redirected to the next step', async () => {
        const [redirectUrl] = h.redirect.lastCall.args;
        expect(redirectUrl).to.equal('/admin/return/units?returnId=test-return-id');
      });
    });

    experiment('for an invalid request', () => {
      beforeEach(async () => {
        request.payload.method = '';
        await controller.postInternalMethod(request, h);
      });

      test('the data is not saved to session', async () => {
        expect(sessionHelpers.saveSessionData.called).to.be.false();
      });

      test('the view is shown again', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('water/returns/internal/form');
      });
    });
  });

  experiment('getMeterDetailsProvided', () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {},
          view: {}
        },
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        }
      };

      h = {
        view: sandbox.stub()
      };

      await controller.getMeterDetailsProvided(request, h);
    });

    test('uses the default form view', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('water/returns/internal/form');
    });

    test('back is set to the correct previous page', async () => {
      const [, data] = h.view.lastCall.args;
      expect(data.back).to.equal('/admin/return/units?returnId=test-return-id');
    });
  });

  experiment('postMeterDetailsProvided', () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {},
          view: {}
        },
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        },
        payload: {
          meterDetailsProvided: 'true',
          csrf_token: 'test'
        }
      };

      h = {
        view: sandbox.stub(),
        redirect: sandbox.stub()
      };
    });

    experiment('for a valid request', () => {
      beforeEach(async () => {
        await controller.postMeterDetailsProvided(request, h);
      });

      test('the expected data is saved to session', async () => {
        const [, data] = sessionHelpers.saveSessionData.lastCall.args;
        expect(data.meters[0].meterDetailsProvided).to.equal(true);
      });

      test('user is redirected to the next step', async () => {
        const [redirectUrl] = h.redirect.lastCall.args;
        expect(redirectUrl).to.equal('/admin/return/meter/details?returnId=test-return-id');
      });
    });

    experiment('for an invalid request', () => {
      beforeEach(async () => {
        request.payload.meterDetailsProvided = false;
        await controller.postMeterDetailsProvided(request, h);
      });

      test('the data is not saved to session', async () => {
        expect(sessionHelpers.saveSessionData.called).to.be.false();
      });

      test('the view is shown again', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('water/returns/internal/form');
      });
    });
  });

  experiment('getSingleTotalAbstractionPeriod', () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {},
          view: {}
        },
        query: { returnId: 'test-return-id' },
        view: { csrfToken: 'test' },
        auth: {
          credentials: { scope: 'internal' }
        }
      };

      h = { view: sandbox.stub() };

      await controller.getSingleTotalAbstractionPeriod(request, h);
    });

    test('uses the default form view', async () => {
      const [view] = h.view.lastCall.args;
      expect(view).to.equal('water/returns/internal/form');
    });

    test('back is set to the correct previous page', async () => {
      const [, data] = h.view.lastCall.args;
      expect(data.back).to.equal('/admin/return/single-total?returnId=test-return-id');
    });
  });

  experiment('postSingleTotalAbstractionPeriod', async () => {
    let h;
    let request;

    beforeEach(async () => {
      request = {
        returns: {
          data: {
            requiredLines: [
              { startDate: '2019-01-01', endDate: '2019-02-01' },
              { startDate: '2019-02-01', endDate: '2019-03-01' }
            ]
          },
          view: {}
        },
        query: {
          returnId: 'test-return-id'
        },
        view: {
          csrfToken: 'test'
        },
        auth: {
          credentials: {
            scope: 'internal'
          }
        },
        payload: {
          totalCustomDates: 'false',
          csrf_token: uuid()
        }
      };

      h = {
        view: sandbox.stub(),
        redirect: sandbox.stub()
      };
    });

    experiment('for a valid default period request', () => {
      beforeEach(async () => {
        await controller.postSingleTotalAbstractionPeriod(request, h);
      });

      test('the expected data is saved to session', async () => {
        const [, data] = sessionHelpers.saveSessionData.lastCall.args;
        expect(data.reading.totalCustomDates).to.be.false();
      });

      test('user is redirected to the next step', async () => {
        const [redirectUrl] = h.redirect.lastCall.args;
        expect(redirectUrl).to.equal('/admin/return/quantities?returnId=test-return-id');
      });
    });

    experiment('for a valid custom period request', () => {
      beforeEach(async () => {
        request.payload.totalCustomDates = 'true';
        request.payload['totalCustomDateStart-day'] = '01';
        request.payload['totalCustomDateStart-month'] = '02';
        request.payload['totalCustomDateStart-year'] = '2019';
        request.payload['totalCustomDateEnd-day'] = '03';
        request.payload['totalCustomDateEnd-month'] = '02';
        request.payload['totalCustomDateEnd-year'] = '2019';
        await controller.postSingleTotalAbstractionPeriod(request, h);
      });

      test('the expected data is saved to session', async () => {
        const [, data] = sessionHelpers.saveSessionData.lastCall.args;
        expect(data.reading.totalCustomDates).to.be.true();
        expect(data.reading.totalCustomDateStart).to.equal(new Date(2019, 1, 1));
        expect(data.reading.totalCustomDateEnd).to.equal(new Date(2019, 1, 3));
      });

      test('user is redirected to the next step', async () => {
        const [redirectUrl] = h.redirect.lastCall.args;
        expect(redirectUrl).to.equal('/admin/return/quantities?returnId=test-return-id');
      });
    });

    experiment('for an invalid request', () => {
      beforeEach(async () => {
        request.payload.totalCustomDates = '';
        await controller.postSingleTotalAbstractionPeriod(request, h);
      });

      test('the data is not saved to session', async () => {
        expect(sessionHelpers.saveSessionData.called).to.be.false();
      });

      test('the view is shown again', async () => {
        const [view] = h.view.lastCall.args;
        expect(view).to.equal('water/returns/internal/form');
      });
    });
  });
});
