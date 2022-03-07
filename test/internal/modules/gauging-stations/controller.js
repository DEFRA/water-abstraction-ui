const { cloneDeep } = require('lodash');
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
const services = require('internal/lib/connectors/services');
const { v4: uuid } = require('uuid');

experiment('internal/modules/gauging-stations/controller - tagging', () => {
  beforeEach(async () => {
    sandbox.stub(formHandler, 'handleFormRequest').restore();
    sandbox.restore();

    sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
    sandbox.stub(helpers, 'getSelectedConditionText').resolves('a bit of text is output');
    sandbox.stub(helpers, 'handlePost').resolves();

    sandbox.stub(session, 'get').resolves();
    sandbox.stub(session, 'merge').resolves({});
    sandbox.stub(session, 'clear').resolves({});
    sandbox.stub(formHandler, 'handleFormRequest').resolves({});
  });

  afterEach(async () => sandbox.restore());

  experiment('.getNewTaggingFlow', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/start'
    };

    const h = { redirect: sandbox.spy() };

    test('redirects the user to the start of the flow', async () => {
      await controller.getNewTaggingFlow(request, h);
      expect(h.redirect.calledWith(`${request.path}/../threshold-and-unit`));
    });
  });

  experiment('.getNewTaggingThresholdAndUnit', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/threshold',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getNewTaggingThresholdAndUnit(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postNewTaggingThresholdAndUnit', () => {
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
      threshold: {
        name: 'threshold',
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
        controller.postNewTaggingThresholdAndUnit(request, h);
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
        await controller.postNewTaggingThresholdAndUnit(request, h);
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

  experiment('.getNewTaggingAlertType', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/alert-type',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getNewTaggingAlertType(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postNewTaggingAlertType', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/alert-type',
      method: 'post',
      view: {
        csrfToken: 'some-token'
      }
    };

    const formContent = {
      fields: [
        {
          name: 'alertType',
          value: 'reduce',
          options: {
            choices: [
              {
                value: 'reduce',
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
      alertType: {
        name: 'alertType',
        value: 'reduce',
        options: {
          choices: [
            {
              value: 'reduce',
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
        controller.postNewTaggingAlertType(request, h);
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
        controller.postNewTaggingAlertType(request, h);
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

  experiment('.postRemoveTagsLicenceSelected', () => {
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
      ]
    };
    const params = {
      gaugingStationId: 'e3e95a10-a989-42ae-9692-feac91f06ffb'
    };
    const request = {
      path: 'http://example.com/monitoring-stations/123/untagging-licence/remove-tag',
      params,
      view: {
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: data
      }
    };

    const formContentMultipleSelected = {
      fields: [{
        name: 'selectedCondition',
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
            },
            {
              licenceGaugingStationId: '9177f85d-916c-4d51-8db7-74246d228b7b',
              value: '6e21a77b-1525-459d-acb8-3615e5d53f07',
              label: ' Stop at 151 Megalitres per day',
              hint: '2672520010',
              licenceRef: '2672520010',
              alertType: 'stop',
              thresholdValue: '151',
              thresholdUnit: 'Megalitres per day',
              licenceId: '6e21a77b-1525-459d-acb8-3615e5d53f06'
            }
          ],
          selectedChoices: [
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
            },
            {
              licenceGaugingStationId: '9177f85d-916c-4d51-8db7-74246d228b7b',
              value: '6e21a77b-1525-459d-acb8-3615e5d53f07',
              label: ' Stop at 151 Megalitres per day',
              hint: '2672520010',
              licenceRef: '2672520010',
              alertType: 'stop',
              thresholdValue: '151',
              thresholdUnit: 'Megalitres per day',
              licenceId: '6e21a77b-1525-459d-acb8-3615e5d53f06'
            }
          ],
          label: '',
          widget: 'checkbox',
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
        value: '22c784b7-b141-4fd0-8ee1-78ea7ae783bc'
      }]
    };
    const formContentMultipleSelectedNothing = {
      fields: [{
        name: 'selectedLicence',
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
          selectedChoices: [],
          label: '',
          widget: 'checkbox',
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
        value: '0'
      }]
    };
    const formContentSingleSelected = {
      fields: [{
        name: 'selectedLicence',
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
          selectedChoices: [
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
      }]
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        formHandler.handleFormRequest.resolves({
          ...formContentMultipleSelectedNothing,
          isValid: false
        });
        controller.getRemoveTags(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls handleFormRequest to process the payload through the form', () => {
        controller.postRemoveTagOrMultiple(request, h);
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('redirects the user back to the form', () => {
        expect(h.postRedirectGet.called).to.be.true();
      });
    });

    experiment('selectedLicence containing multiple matching licenceId ', () => {
      beforeEach(() => {
        session.merge.returns({
          selectedCondition: formContentMultipleSelected.fields[0],
          licenceGaugingStations: data.data
        });
        formHandler.handleFormRequest.resolves({
          ...formContentMultipleSelected,
          isValid: true
        });
        controller.getRemoveTags(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('.getRemoveTags displaying expected forms', () => {
        controller.getRemoveTags(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagOrMultiple displaying expected forms', () => {
        formContentMultipleSelected.value = 0;
        formHandler.handleFormRequest.resolves({
          ...formContentMultipleSelectedNothing,
          isValid: true
        });
        controller.postRemoveTagOrMultiple(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagsLicenceSelected', () => {
        controller.postRemoveTagsLicenceSelected(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagsLicenceSelected invalid form', () => {
        formHandler.handleFormRequest.resolves({
          ...formContentMultipleSelectedNothing,
          isValid: false
        });
        controller.postRemoveTagsLicenceSelected(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.getRemoveTagsConditions', () => {
        controller.getRemoveTagsConditions(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagComplete', () => {
        controller.postRemoveTagComplete(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.getRemoveTagComplete displaying expected forms', () => {
        controller.getRemoveTagComplete(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.getRemoveTagComplete with no selectedCondition.options', () => {
        formHandler.handleFormRequest.resolves({
          ...formContentMultipleSelectedNothing,
          isValid: true
        });
        controller.getRemoveTagComplete(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
    });

    experiment('selectedLicence containing one matching licenceId ', () => {
      beforeEach(() => {
        session.merge.returns({
          selectedLicence: formContentSingleSelected.fields[0],
          licenceGaugingStations: data.data
        });
        formHandler.handleFormRequest.resolves({
          ...formContentSingleSelected,
          isValid: true
        });
        controller.getRemoveTags(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('.getRemoveTags displaying expected forms', () => {
        controller.getRemoveTags(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
        expect(h.view.lastCall.args[1].pageTitle).to.equal('Which licence do you want to remove a tag from?');
      });

      test('.postRemoveTagOrMultiple displaying expected forms', () => {
        controller.postRemoveTagOrMultiple(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagOrMultiple without data', () => {
        const newRequest = cloneDeep(request);
        newRequest.pre.licenceGaugingStations = undefined;
        controller.postRemoveTagOrMultiple(newRequest, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagsLicenceSelected', () => {
        controller.postRemoveTagsLicenceSelected(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.postRemoveTagComplete', () => {
        controller.postRemoveTagComplete(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
      });

      test('.getRemoveTagComplete displaying expected forms', () => {
        controller.getRemoveTagComplete(request, h);
        const [template] = h.view.lastCall.args;
        expect(template).to.equal('nunjucks/form');
        expect(h.postRedirectGet.called).to.be.true();
        expect(h.view.lastCall.args[1].pageTitle).to.equal('Which licence do you want to remove a tag from?');
      });
    });

    experiment('.getRemoveTagsConditions', () => {
      const params = {
        gaugingStationId: 'e3e95a10-a989-42ae-9692-feac91f06ffb'
      };
      const request = {
        path: 'http://example.com/monitoring-stations/123/untagging-licence/remove-tag',
        params,
        method: 'get',
        view: {
          csrfToken: 'some-token'
        }
      };
      const h = { view: sandbox.spy() };

      beforeEach(async () => {
        await formHandler.handleFormRequest.resolves({ form: { fields: [{ name: 'selectedLicence' }] } });
        controller.getRemoveTagsConditions(request, h);
      });

      afterEach(async () => sandbox.restore());

      test('returns some gumph with h.view', () => {
        expect(h.view.called).to.be.true();
      });
    });
  });

  experiment('.getNewTaggingLicenceNumber', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/licence-number',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getNewTaggingLicenceNumber(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postNewTaggingLicenceNumber', () => {
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
      licenceNumber: {
        name: 'licenceNumber',
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
        controller.postNewTaggingLicenceNumber(request, h);
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
        controller.postNewTaggingLicenceNumber(request, h);
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
          request.pre = {
            isLicenceNumberValid: false
          };
          controller.postNewTaggingLicenceNumber(request, h);
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

  experiment('.getNewTaggingCondition', () => {
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
      controller.getNewTaggingCondition(request, h);
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

  experiment('.postNewTaggingCondition', () => {
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
        controller.postNewTaggingCondition(request, h);
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
        controller.postNewTaggingCondition(request, h);
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

  experiment('.getNewTaggingManuallyDefinedAbstractionPeriod', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/tagging-licence/abstraction-period',
      method: 'get',
      view: {
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(() => {
      controller.getNewTaggingManuallyDefinedAbstractionPeriod(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });

    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postNewTaggingManuallyDefinedAbstractionPeriod', () => {
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
        controller.postNewTaggingManuallyDefinedAbstractionPeriod(request, h);
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
        controller.postNewTaggingManuallyDefinedAbstractionPeriod(request, h);
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

  experiment('.getNewTaggingCheckYourAnswers', () => {
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
      controller.getNewTaggingCheckYourAnswers(request, h);
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

  experiment('.postNewTaggingCheckYourAnswers', () => {
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
        controller.postNewTaggingCheckYourAnswers(request, h);
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
        controller.postNewTaggingCheckYourAnswers(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls post helper', () => {
        expect(helpers.handlePost.called).to.be.true();
      });

      test('redirects the user to the next thing', () => {
        expect(h.redirect.called).to.be.true();
      });
    });

    experiment('.getNewTaggingFlowComplete', () => {
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
        controller.getNewTaggingFlowComplete(request, h);
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

experiment('internal/modules/gauging-stations/controller - viewing', () => {
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

experiment('internal/modules/gauging-stations/controller - sending', () => {
  experiment('.getSendAlertSelectAlertType', () => {
    const request = {
      method: 'get',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.spy(),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/alert-type',
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.spy() };

    beforeEach(async () => {
      sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
      await controller.getSendAlertSelectAlertType(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postSendAlertSelectAlertType', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/send-alert/alert-type',
      method: 'post',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.spy(),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/alert-type',
        csrfToken: 'some-token'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    const formContent = {
      fields: [{ name: 'alertType', value: 'warning' }]
    };

    const storedData = {
      sendingAlertType: {
        name: 'alertType',
        value: 'warning'
      }
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(session, 'get').resolves();
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postSendAlertSelectAlertType(request, h);
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
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(session, 'get').resolves();
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        await formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controller.postSendAlertSelectAlertType(request, h);
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

  experiment('.getSendAlertSelectAlertThresholds', () => {
    const request = {
      method: 'get',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.spy(),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/alert-thresholds',
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: { data: [] }
      }

    };

    const h = { view: sandbox.spy() };

    beforeEach(async () => {
      sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
      await controller.getSendAlertSelectAlertThresholds(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('calls the helper method which generates a caption', async () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('returns some gumph with h.view', () => {
      expect(h.view.called).to.be.true();
    });
  });

  experiment('.postSendAlertSelectAlertThresholds', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/send-alert/alert-thresholds',
      method: 'post',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.spy(),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/alert-thresholds',
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: { data: [] }
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    const formContent = {
      fields: [{
        name: 'alertThresholds',
        value: ['{"unit":"Ml/d", "value":100}']
      }]
    };

    const storedData = {
      alertThresholds: {
        name: 'alertThresholds',
        value: ['{"unit":"Ml/d", "value":100}']
      },
      selectedGroupedLicences: []
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(session, 'get').resolves();
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postSendAlertSelectAlertThresholds(request, h);
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
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(session, 'get').resolves({
          sendingAlertType: {
            name: 'sendingAlertType',
            value: 'warning'
          }
        });
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        await formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controller.postSendAlertSelectAlertThresholds(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls session.merge with the expected data', () => {
        expect(session.merge.lastCall.args[1]).to.equal(storedData);
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
    });
  });

  experiment('.getSendAlertSelectAlertThresholds', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/send-alert/check-licence-matches',
      method: 'get',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.stub().returns({}),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/check-licence-matches',
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: { data: [] }
      }

    };

    const h = { view: sandbox.spy(), redirect: sandbox.spy() };

    experiment('when there are no matches', () => {
      beforeEach(async () => {
        request.yar.get.returns({ selectedGroupedLicences: undefined });
        sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
        await controller.getSendAlertCheckLicenceMatches(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('it redirects the user to the previous step', () => {
        expect(h.redirect.calledWith('http://example.com/monitoring-stations/123/send-alert/alert-thresholds'));
      });
    });

    experiment('when there are matches but they boil down to an empty/useless array', () => {
      beforeEach(async () => {
        request.yar.get.returns({
          selectedGroupedLicences: {
            someLicenceId: []
          }
        });
        sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
        await controller.getSendAlertCheckLicenceMatches(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('it redirects the user to the previous step', () => {
        expect(h.redirect.calledWith('http://example.com/monitoring-stations/123/send-alert/alert-thresholds'));
      });
    });

    experiment('when there are matches', () => {
      beforeEach(async () => {
        request.yar.get.returns({
          selectedGroupedLicences: {
            someLicenceId: [
              {
                dateStatusUpdated: new Date()
              }
            ]
          }
        });
        sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
        await controller.getSendAlertCheckLicenceMatches(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls the helper method which generates a caption', async () => {
        expect(helpers.getCaption.called).to.be.true();
      });
      test('returns some gumph with h.view', () => {
        expect(h.view.called).to.be.true();
      });
    });
  });

  // getSendAlertExcludeLicence

  experiment('.getSendAlertExcludeLicence', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/send-alert/exclude-licence',
      method: 'get',
      params: {
        gaugingStationId: '123'
      },
      yar: {
        get: sandbox.stub().resolves({}),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/exclude-licence',
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: { data: [] }
      }

    };

    const h = { view: sandbox.spy(), redirect: sandbox.spy() };

    experiment('when the licenceId is invalid', () => {
      beforeEach(async () => {
        request.params.licenceId = 'id-456';
        request.yar.get.resolves({
          selectedGroupedLicences: {
            someLicenceId: [
              {
                licenceId: 'id-123'
              }
            ]
          }
        });
        await controller.getSendAlertExcludeLicence(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('redirects the user to the previous page', async () => {
        expect(h.redirect.calledWith('/monitoring-stations/123/send-alert/check-licence-matches')).to.be.true();
      });
    });

    experiment('when the licenceId is valid', () => {
      beforeEach(async () => {
        request.params.licenceId = 'id-123';
        request.yar.get.resolves({
          selectedGroupedLicences: {
            someLicenceId: [
              {
                licenceId: 'id-123'
              }
            ]
          }
        });
        sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
        await controller.getSendAlertExcludeLicence(request, h);
      });
      afterEach(async () => sandbox.restore());

      test('calls the helper method which generates a caption', async () => {
        expect(helpers.getCaption.called).to.be.true();
      });
      test('returns some gumph with h.view', () => {
        expect(h.view.called).to.be.true();
      });
    });
  });

  experiment('.getSendAlertExcludeLicenceConfirm', () => {
    const gsId = uuid();
    const l1Id = uuid();
    const l2Id = uuid();
    const request = {
      path: `http://example.com/monitoring-stations/${gsId}/send-alert/exclude-licence/${l2Id}/confirm`,
      method: 'get',
      params: {
        gaugingStationId: gsId,
        licenceId: l2Id
      },
      yar: {
        get: sandbox.stub().resolves({}),
        set: sandbox.spy()
      },
      view: {
        path: `http://example.com/monitoring-stations/${gsId}/send-alert/exclude-licence/${l2Id}/confirm`,
        csrfToken: 'some-token'
      },
      pre: {
        licenceGaugingStations: { data: [] }
      }

    };

    const h = { view: sandbox.spy(), redirect: sandbox.spy() };

    beforeEach(async () => {
      request.params.licenceId = l2Id;
      sandbox.stub(session, 'get').resolves({
        selectedGroupedLicences:
          [
            [{
              l1Id: {
                licenceId: l1Id
              }
            }],
            [{
              l2Id: {
                licenceId: l2Id
              }
            }]
          ]
      });
      sandbox.stub(session, 'merge').resolves({});
      sandbox.stub(session, 'clear').resolves({});
      await controller.getSendAlertExcludeLicenceConfirm(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('grabs session data', async () => {
      expect(session.get.called).to.be.true();
    });

    test('stores session data using merge', async () => {
      expect(session.merge.called).to.be.true();
    });

    test('redirects the user to the check page', async () => {
      expect(h.redirect.calledWith(`/monitoring-stations/${gsId}/send-alert/check-licence-matches`)).to.be.true();
    });
  });

  experiment('.getSendAlertEmailAddress', () => {
    const gsId = uuid();
    const request = {
      path: `http://example.com/monitoring-stations/${gsId}/send-alert/email-address`,
      method: 'get',
      defra: {
        userName: 'some.person@defra.gov.uk'
      },
      params: {
        gaugingStationId: gsId
      },
      yar: {
        get: sandbox.stub().resolves({}),
        set: sandbox.spy(),
        clear: sandbox.spy()
      },
      view: {
        path: `http://example.com/monitoring-stations/${gsId}/send-alert/email-address`,
        csrfToken: 'some-token'
      }
    };

    const h = { view: sandbox.stub().returns({}), redirect: sandbox.spy() };

    beforeEach(async () => {
      sandbox.stub(session, 'get').resolves({});
      sandbox.stub(session, 'merge').resolves({});
      sandbox.stub(session, 'clear').resolves({});
      sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
      sandbox.stub(formHandler, 'handleFormRequest').resolves({});
      await controller.getSendAlertEmailAddress(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('renders a caption', () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('renders a form', async () => {
      expect(h.view.calledWith('nunjucks/form')).to.be.true();
    });
  });

  experiment('.postSendAlertEmailAddress', () => {
    const request = {
      path: 'http://example.com/monitoring-stations/123/send-alert/email-address',
      method: 'post',
      params: {
        gaugingStationId: uuid()
      },
      yar: {
        get: sandbox.spy(),
        set: sandbox.spy()
      },
      view: {
        path: 'http://example.com/monitoring-stations/123/send-alert/email-address',
        csrfToken: 'some-token'
      }
    };

    const h = {
      view: sandbox.spy(),
      postRedirectGet: sandbox.spy(),
      redirect: sandbox.spy()
    };

    const formContent = {
      fields: [{
        name: 'useLoggedInUserEmailAddress',
        value: true
      }]
    };

    const storedData = {
      customEmailAddress: null,
      useLoggedInUserEmailAddress: {
        name: 'useLoggedInUserEmailAddress',
        value: true
      }
    };

    experiment('when the payload is invalid', () => {
      beforeEach(() => {
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(session, 'get').resolves();
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: false
        });
        controller.postSendAlertEmailAddress(request, h);
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
      const arg1 = uuid();
      const arg2 = uuid();
      const notificationEventId = uuid();
      beforeEach(async () => {
        sandbox.stub(formHandler, 'handleFormRequest').resolves({});
        sandbox.stub(helpers, 'getBatchAlertData').resolves(arg2);
        sandbox.stub(helpers, 'getIssuer').resolves(arg1);
        sandbox.stub(services.water.batchNotifications, 'prepareWaterAbstractionAlerts').resolves({
          data: {
            id: notificationEventId
          }
        });
        sandbox.stub(session, 'get').resolves({
          customEmailAddress: null,
          useLoggedInUserEmailAddress: {
            customEmailAddress: null,
            name: 'useLoggedInUserEmailAddress',
            value: true
          }
        });
        sandbox.stub(session, 'merge').resolves({});
        sandbox.stub(session, 'clear').resolves({});
        await formHandler.handleFormRequest.resolves({
          ...formContent,
          isValid: true
        });
        await controller.postSendAlertEmailAddress(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls session.merge with the expected data', () => {
        expect(session.merge.firstCall.args[1]).to.equal(storedData);
      });
      test('calls handleFormRequest to process the payload through the form', () => {
        expect(formHandler.handleFormRequest.called).to.be.true();
      });
      test('calls the helper method to prepare the batch alert', () => {
        expect(helpers.getBatchAlertData.called).to.be.true();
      });
      test('calls the helper method to compose the sender email', () => {
        expect(helpers.getIssuer.called).to.be.true();
      });
      test('calls the service endpoint for preparing the batch', () => {
        expect(services.water.batchNotifications.prepareWaterAbstractionAlerts.calledWith(arg1, arg2)).to.be.true();
      });
      test('calls session.merge again to store the notification ID', () => {
        expect(session.merge.lastCall.args[1]).to.equal({
          notificationEventId
        });
      });
    });
  });

  experiment('.getSendAlertEmailAddress', () => {
    const gsId = uuid();
    const request = {
      path: `http://example.com/monitoring-stations/${gsId}/send-alert/processing`,
      method: 'get',
      params: {
        gaugingStationId: gsId
      },
      yar: {
        get: sandbox.stub().resolves({}),
        set: sandbox.spy(),
        clear: sandbox.spy()
      },
      view: {
        path: `http://example.com/monitoring-stations/${gsId}/send-alert/processing`,
        csrfToken: 'some-token'
      }
    };

    const h = {
      view: sandbox.stub().returns({}),
      redirect: sandbox.stub().returns({})
    };

    const notificationEventId = uuid();
    beforeEach(async () => {
      await sandbox.stub(session, 'get').resolves({
        notificationEventId
      });
      sandbox.stub(session, 'merge').resolves({});
      sandbox.stub(session, 'clear').resolves({});
      sandbox.stub(helpers, 'getCaption').resolves('a caption is output');
      sandbox.stub(services.water.events, 'findOne').resolves({
        data: {
          status: 'processing'
        }
      });
      await controller.getSendAlertProcessing(request, h);
    });
    afterEach(async () => sandbox.restore());

    test('renders a caption', () => {
      expect(helpers.getCaption.called).to.be.true();
    });
    test('calls session.get to fetch the notification Id', () => {
      expect(session.get.called).to.be.true();
    });
    test('calls the events service to fetch the event record', () => {
      expect(services.water.events.findOne.calledWith(notificationEventId)).to.be.true();
    });
    experiment('when the event is still processing', () => {
      beforeEach(async () => {
        services.water.events.findOne.resolves({
          data: {
            status: 'processing'
          }
        });
      });
      afterEach(async () => sandbox.restore());
      test('redirects to processing', async () => {
        expect(h.view.calledWith('nunjucks/gauging-stations/processing-sending-alerts')).to.be.true();
      });
    });

    experiment('when the event is done processing', () => {
      beforeEach(async () => {
        await services.water.events.findOne.resolves({
          data: {
            status: 'hurrah'
          }
        });
        await controller.getSendAlertProcessing(request, h);
      });
      afterEach(async () => sandbox.restore());
      test('redirects to the check page', async () => {
        expect(h.redirect.calledWith(`http://example.com/monitoring-stations/${gsId}/send-alert/check`)).to.be.true();
      });
    });
  });
  // getSendAlertCheck
  experiment('.getSendAlertPreview', () => {
    let h;
    experiment('given a Resume notification', () => {
      beforeEach(async () => {
        h = {
          view: sandbox.stub().returns({}),
          redirect: sandbox.stub().returns({})
        };
        await sandbox.stub(services.water.notifications, 'getNotificationMessage').resolves({
          data: {
            messageRef: 'resume-message-ref',
            personalisation: {
              alertType: 'some alert type'
            }
          }
        });
        await sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves({
          label: 'station name',
          riverName: 'river paddle'
        });
        await controller.getSendAlertPreview({
          params: {
            notificationId: 'some-id',
            gaugingStationId: 'some-other-id'
          }
        }, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls h.view with a letter preview path', async () => {
        expect(h.view.called).to.be.true();
        expect(h.view.lastCall.args[0]).to.equal('nunjucks/gauging-stations/letter-preview/resume-message-ref');
      });
      test('calls h.view with the correct pageTitle', async () => {
        expect(h.view.called).to.be.true();
        expect(h.view.lastCall.args[1].pageTitle).to.equal('Resume message preview');
      });
    });
    experiment('given a letter notification', () => {
      beforeEach(async () => {
        h = {
          view: sandbox.stub().returns({}),
          redirect: sandbox.stub().returns({})
        };
        await sandbox.stub(services.water.notifications, 'getNotificationMessage').resolves({
          data: {
            messageRef: 'message-ref',
            personalisation: {
              alertType: 'some alert type'
            }
          }
        });
        await sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves({
          label: 'station name',
          riverName: 'river paddle'
        });
        await controller.getSendAlertPreview({
          params: {
            notificationId: 'some-id',
            gaugingStationId: 'some-other-id'
          }
        }, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls h.view with a letter preview path', async () => {
        expect(h.view.called).to.be.true();
        expect(h.view.lastCall.args[0]).to.equal('nunjucks/gauging-stations/letter-preview/message-ref');
      });
    });

    experiment('given an email notification', () => {
      beforeEach(async () => {
        h = {
          view: sandbox.stub().returns({}),
          redirect: sandbox.stub().returns({})
        };
        await sandbox.stub(services.water.notifications, 'getNotificationMessage').resolves({
          data: {
            messageRef: 'message-ref_email',
            personalisation: {
              alertType: 'some alert type'
            }
          }
        });
        await sandbox.stub(services.water.gaugingStations, 'getGaugingStationbyId').resolves({
          label: 'station name',
          riverName: 'river paddle'
        });
        await controller.getSendAlertPreview({
          params: {
            notificationId: 'some-id',
            gaugingStationId: 'some-other-id'
          }
        }, h);
      });
      afterEach(async () => sandbox.restore());
      test('calls h.view with a letter preview path, sans _email', async () => {
        expect(h.view.called).to.be.true();
        expect(h.view.lastCall.args[0]).to.startWith('nunjucks/gauging-stations/letter-preview/message-ref');
      });
    });
  });
  // getSendAlertConfirm
});
