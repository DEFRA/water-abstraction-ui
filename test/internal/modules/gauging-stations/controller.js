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

experiment('internal/modules/gauging-stations/controller', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
    sandbox.stub(session, 'get').resolves();
    sandbox.stub(session, 'merge').resolves({});
    sandbox.stub(formHandler, 'handleFormRequest').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.getNewFlow', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/start'
    };

    const h = { redirect: sandbox.spy() };

    test('redirects the user to the start of the flow', async () => {
      await controller.getNewFlow(request, h);
      expect(h.redirect.calledWith(`${request.path}/../threshold-and-unit`));
    });
  });

  experiment('.getThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/threshold',
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
      path: 'http://example.com/monitoring-stations/123/threshold',
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
      path: 'http://example.com/monitoring-stations/123/alert-type',
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
      path: 'http://example.com/monitoring-stations/123/alert-type',
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
      path: 'http://example.com/monitoring-stations/123/licence-number',
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
      path: 'http://example.com/monitoring-stations/123/licence-number',
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
      path: 'http://example.com/monitoring-stations/123/condition',
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
      path: 'http://example.com/monitoring-stations/123/condition',
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
    });
  });
});
