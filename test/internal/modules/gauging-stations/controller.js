const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { expect } = require('@hapi/code');

const controller = require('../../../../src/internal/modules/gauging-stations/controller');
const helpers = require('../../../../src/internal/modules/gauging-stations/lib/helpers');
const session = require('../../../../src/internal/modules/gauging-stations/lib/session');
const formHandler = require('../../../../src/shared/lib/form-handler');
const formHelpers = require('../../../../src/shared/lib/forms');
const uuid = require('uuid').v4;

experiment('internal/modules/gauging-stations/controller', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
    sandbox.stub(helpers, 'getSelectedConditionText').resolves('a bit of text is output');
    sandbox.stub(helpers, 'handlePost').resolves();

    sandbox.stub(session, 'get').resolves();
    sandbox.stub(session, 'merge').resolves({});
    sandbox.stub(session, 'clear').resolves({});
    sandbox.stub(formHandler, 'handleFormRequest').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.getNewFlow', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/start'
    };

    const h = { redirect: sandbox.spy() };

    test('redirects the user to the start of the flow', async () => {
      await controller.getNewFlow(request, h);
      expect(h.redirect.calledWith(`${request.path}/../threshold-and-unit`));
    });
  });

  experiment('.getThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/threshold',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getThresholdAndUnit(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/threshold',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    const formContent = {
      fields: [{ name: 'threshold', value: 100 }, { name: 'unit', value: 'm3/s' }]
    };

    const storedData = {
      threshold: { name: 'threshold',
        value: 100
      },
      unit: {
        name: 'unit', value: 'm3/s'
      }
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postThresholdAndUnit(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('does not call session.merge', () => {
        expect(session.merge.called).to.be.false();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(async () => {
        await formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controller.postThresholdAndUnit(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls session.merge with the expected data', () => {
        expect(session.merge.calledWith(request, storedData)).to.be.true();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
    });
  });

  experiment('.getAlertType', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/alert-type',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getAlertType(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postAlertType', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/alert-type',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      }
    };

    const formContent = {
      fields: [
        { name: 'alertType',
          value: 'reduce',
          options: {
            choices: [
              { value: 'reduce',
                fields: [
                  { name: 'volumeLimited', value: false }
                ]
              }
            ]
          }
        },
        { name: 'volumeLimited', value: false }
      ]
    };

    const storedData = {
      alertType: { name: 'alertType',
        value: 'reduce',
        options: {
          choices: [
            { value: 'reduce',
              fields: [
                { name: 'volumeLimited', value: false }
              ]
            }
          ]
        }
      },
      volumeLimited: { name: 'volumeLimited', value: false }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postAlertType(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        controller.postAlertType(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls session.merge with the expected data', () => {
        expect(session.merge.calledWith(request, storedData)).to.be.true();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
    });
  });

  experiment('.getLicenceNumber', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/licence-number',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getLicenceNumber(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postLicenceNumber', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/licence-number',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        isLicenceNumberValid: true
      }
    };

    const formContent = {
      fields: [
        {
          name: 'licenceNumber',
          value: 'AB/123'
        }
      ]
    };

    const storedData = {
      licenceNumber: { name: 'licenceNumber',
        value: 'AB/123'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postLicenceNumber(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        controller.postLicenceNumber(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls session.merge with the expected data', () => {
        expect(session.merge.calledWith(request, storedData)).to.be.true();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      experiment('when the licence number is not real', () => {
        beforeEach(() => {
          sandbox.stub(formHelpers, 'applyErrors').resolves();
          request['pre'] = {
            isLicenceNumberValid: false
          };
          controller.postLicenceNumber(request, h);
        });
        afterEach(async () => sandbox.restore());

        test('a custom error message is appended to the form', () => {
          expect(formHelpers.applyErrors.called).to.be.true();
        });

        test('the user is redirected back to the licence entry form', () => {
          expect(h.postRedirectGet.called).to.be.true();
        });
      });
    });
  });

  experiment('.getCondition', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/condition',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      session.get.returns({ licenceNumber: { value: 'AB/123' } });
      controller.getCondition(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the session state helper to get the licence reference for the page title', () => {
      expect(session.get.calledWith(request)).to.be.true();
    });
    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postCondition', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/condition',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        isLicenceNumberValid: true
      }
    };

    const formContent = {
      fields: [
        {
          name: 'condition',
          value: 'COND1'
        }
      ]
    };

    const storedData = {
      condition: {
        name: 'condition',
        value: 'COND1'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postCondition(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        controller.postCondition(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls session.merge with the expected data', () => {
        expect(session.merge.calledWith(request, storedData)).to.be.true();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user to the next thing', () => {
        expect(h.redirect.called).to.be.true();
      });
    });
  });

  experiment('.getManuallyDefinedAbstractionPeriod', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/abstraction-period',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getManuallyDefinedAbstractionPeriod(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postManuallyDefinedAbstractionPeriod', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/abstraction-period',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      }
    };

    const formContent = {
      fields: [
        {
          name: 'startDate',
          value: '01-01'
        },
        {
          name: 'endDate',
          value: '01-05'
        }
      ]
    };

    const storedData = {
      startDate: {
        name: 'startDate',
        value: '01-01'
      },
      endDate: {
        name: 'endDate',
        value: '01-05'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postManuallyDefinedAbstractionPeriod(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        controller.postManuallyDefinedAbstractionPeriod(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls session.merge with the expected data', () => {
        expect(session.merge.calledWith(request, storedData)).to.be.true();
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user to the next thing', () => {
        expect(h.redirect.called).to.be.true();
      });
    });
  });

  experiment('.getCheckYourAnswers', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/check',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      session.get.returns({ licenceNumber: { value: 'AB/123' } });
      controller.getCheckYourAnswers(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('calls the session state helper to store checkStageReached', () => {
      expect(session.merge.calledWith(request, { checkStageReached: true })).to.be.true();
    });

    test('calls the getSelectedConditionText helper method', () => {
      expect(helpers.getSelectedConditionText.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postCheckYourAnswers', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/condition',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        isLicenceNumberValid: true
      }
    };

    const formContent = {
      fields: []
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postCheckYourAnswers(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('when the payload is valid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        controller.postCheckYourAnswers(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls post helper', () => {
        expect(helpers.handlePost.called).to.be.true();
      });

      test('redirects the user to the next thing', () => {
        expect(h.redirect.called).to.be.true();
      });
    });

    experiment('.getFlowComplete', () => {
      const request = {
        path: 'http://example.com/monitoring-stations/123/tagging-licence/new-tag-complete',
        method: 'get',
        view: {
          csrfToken: 'some-token'
        },
        params: {
          gaugingStationId: 'some-gauging-station-id'
        }
      };

      const h = { view: sandbox.spy() };

      beforeEach(() => {
        session.get.returns({ licenceNumber: { value: 'AB/123' } });
        controller.getFlowComplete(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls the session clear method', () => {
        expect(session.clear.calledWith(request)).to.be.true();
      });

      test('returns some gumph with h.view', () => {
        expect(h.view.called).to.be.true();
      });
    });
  });
});

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
    stationReference: '1',
    status: 'reduce'
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
        station: {
          catchmentName: 'some name'
        },
        licenceGaugingStations: {
          data: res
        }
      }
    };

    h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.stub(),
      redirect: sandbox.stub()
    };
    await controller.getMonitoringStation(request, h);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the page is loaded with the correct nunjucks template', async () => {
    const [template] = h.view.lastCall.args;
    expect(template).to.equal('nunjucks/gauging-stations/gauging-station');
  });
});
